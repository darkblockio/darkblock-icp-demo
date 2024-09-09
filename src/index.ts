import { v4 as uuidv4 } from 'uuid';   // Generates unique IDs
import { Server, StableBTreeMap, ic } from 'azle';  // Azle imports for building the canister server and data storage
import express from 'express';   // Express for handling HTTP requests
import multer from 'multer';     // Multer for file upload handling in Express
import { encrypt, decrypt } from "./util/encryption";  // Custom encryption and decryption utilities

// Multer storage configuration to store uploaded files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Represents a darkblock, a digital asset containing metadata and encrypted file data.
 * This type is stored in a BTreeMap and contains metadata about the file's origin and encryption.
 */
class Darkblock {
    id: string;                // Unique identifier for the darkblock (later be replaced by transaction id from arweave)
    name: string;              // Name of the darkblock or file
    creator_address: string;   // Creator's address (usually for blockchain purposes)
    nft_platform: string;      // Platform on which the related NFT resides
    nft_standard: string;      // NFT standard (e.g., ERC-721, ERC-1155, Metaplex)
    data: Uint8Array;          // Encrypted file data stored as a byte array
    iv: string;                // Initialization vector used for encryption
    filename: string;          // Original filename of the uploaded file
    mimeType: string;          // MIME type of the uploaded file
    size: number;              // File size in bytes
    createdAt: Date;           // Timestamp for when the darkblock was created
    updatedAt: Date | null;    // Timestamp for when the darkblock was last updated, if applicable
}

// Initialize a StableBTreeMap to store Darkblocks using their ID as the key
const darkblocksStorage = StableBTreeMap<string, Darkblock>(0);

/**
 * Entry point for the Azle server. This creates an Express server and defines the API routes for handling darkblocks.
 */
export default Server(() => {
   const app = express();
   app.use(express.json());  

   // Multer middleware to handle file uploads
   const uploadMiddleware = upload.single('file');

   /**
    * POST /darkblock
    * Route for minting (creating) a new darkblock.
    * This endpoint accepts file uploads and related metadata, encrypts the file, and stores it in the StableBTreeMap.
    * Ideally this would interact with a Management Canister to make outcalls to Darkblock Services (API, Protocol) for proper encryption and later decryption
    */
   app.post('/darkblock/create', uploadMiddleware, async (req, res) => {
      try {
         const darkblockId = uuidv4();  // Generate a unique ID for the new darkblock
         const { name, creator_address, nft_platform, nft_standard } = req.body;

         // Validate that required fields and a file are provided
         if (!req.file || !name || !creator_address || !nft_platform || !nft_standard) 
            return res.status(400).send('Missing required fields or file.');
         

         // Encrypt the file 
         const encryptedData = encrypt(req.file.buffer);

         // Create a new Darkblock object with metadata and encrypted file data
         const darkblock: Darkblock = { 
            id: darkblockId,
            name: name,
            creator_address: creator_address,
            nft_platform: nft_platform,
            nft_standard: nft_standard,
            data: encryptedData.content, // Store the encrypted content
            iv: encryptedData.iv,        // Store the initialization vector used for encryption
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            createdAt: getCurrentDate(),  // Use the ICP system timestamp 
            updatedAt: null
         };

         // Store the new darkblock in the StableBTreeMap
         darkblocksStorage.insert(darkblock.id, darkblock);

         // Respond with the darkblock ID (that can be passed to /decrpt or /metadata) and success message
         return res.status(200).json({
            darkblock_id: darkblock.id,
            message: 'Darkblock Mint Successful!',
         });
      } catch (error) {
         console.error('Error minting Darkblock:', error);
         res.status(500).json({ message: 'Error minting Darkblock: ' + error.message });
      }
   });

   /**
    * GET /darkblock/decrypt/:id
    * Route for retrieving and decrypting a darkblock by its ID.
    * Returns the decrypted file content as a downloadable file.
    */
   app.get("/darkblock/decrypt/:id", (req, res) => {
      try {
         const darkblockId = req.params.id;  // Extract the darkblock ID from the request URL
         const darkblockOpt = darkblocksStorage.get(darkblockId);

         // Check if the darkblock exists in the storage
         if ("None" in darkblockOpt) 
            return res.status(404).send(`Darkblock with id=${darkblockId} not found`);
         

         const darkblock: Darkblock = darkblockOpt.Some;

         // Decrypt the stored file content using the encryption IV and data
         const decryptedData = decrypt({ iv: darkblock.iv, content: darkblock.data });

         // Set response headers to allow file download with correct metadata
         res.setHeader('Content-Type', darkblock.mimeType);
         res.setHeader('Content-Disposition', `attachment; filename="${darkblock.filename}"`);
         res.send(decryptedData);  // Send the decrypted file content
      } catch (error) {
         console.error('Error retrieving Darkblock:', error);
         res.status(500).json({ message: 'Error retrieving Darkblock: ' + error.message });
      }
   });

   /**
    * GET /darkblock/metadata/:id
    * Route for retrieving the metadata of a darkblock by its ID.
    * Returns only metadata, excluding the encrypted file content.
    */
   app.get("/darkblock/metadata/:id", (req, res) => {
      try {
         const darkblockId = req.params.id;  // Extract the darkblock ID from the request URL
         const darkblockOpt = darkblocksStorage.get(darkblockId);

         // Check if the darkblock exists in the storage
         if ("None" in darkblockOpt) {
            return res.status(404).send(`Darkblock with id=${darkblockId} not found`);
         }

         const darkblock: Darkblock = darkblockOpt.Some;

         // Exclude the file data from the response and return only metadata
         const { data, ...metadata } = darkblock;
         return res.status(200).json({ metadata });
      } catch (error) {
         console.error('Error retrieving Darkblock metadata:', error);
         res.status(500).json({ message: 'Error retrieving Darkblock metadata: ' + error.message });
      }
   });



   return app.listen();  // Start the Express server
});

/**
 * Helper function to get the current date and time in the ICP system.
 * Converts the IC time to a JavaScript Date object.
 * @returns {Date} The current date and time.
 */
function getCurrentDate() {
   const timestamp = new Number(ic.time());  // Fetch IC time as a timestamp
   return new Date(timestamp.valueOf() / 1000_000);  // Convert IC time to Date (dividing by 1,000,000 to get milliseconds)
}
