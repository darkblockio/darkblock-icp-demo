# Darkblock x ICP Demo

This repository demonstrates the integration of **Darkblock** with the Internet Computer Protocol (ICP), allowing creators to encrypt and consume content based on token ownership. 

### Project Overview

At **Darkblock**, we empower creators to protect and control their digital content using encryption mechanisms tied to NFTs and token ownership. While our core infrastructure leverages **Arweave** for storing encrypted files, this demo explores how ICP can be used as a cache for encrypted files and integrates with our protocol.

Visit [Darkblock.io](https://www.darkblock.io) to learn more about our main platform and services.

This demo focuses on:
- Storing files using ICP's **StableMapTree** (with plans to transition to a more efficient storage solution such as an **Asset Container**).
- Basic encryption performed on the canister (to be replaced with Darkblock's **API and Protocol** for stronger encryption in the future).
- Simple decryption also handled on the canister (to be replaced with our service in a production environment).

### Roadmap for Future Enhancements
- Integrating Darkblock Protocol for both encryption and decryption, making use of our full service offering.
- Caching encrypted files on ICP in addition to Arweave.
- Enhanced storage options for encrypted files in ICP's ecosystem.

---

## Getting Started

This guide assumes you have the necessary development environment already set up, including **Node.js**, **nvm**, **dfx**, and **podman**. If you're new to ICP, you can follow this [setup guide](https://dacade.org/communities/icp/courses/typescript-smart-contract-101/learning-modules/b14741ea-ee33-43a4-a742-9cdc0a6f0d1c).

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/darkblockio/darkblock-icp-demo.git
    cd darkblock-icp-demo
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Ensure no other instances of dfx are running:
    ```bash
    dfx stop
    ```

4. Start dfx:
    ```bash
    dfx start --host 127.0.0.1:8000 --clean --background
    ```

    You should see an output similar to:
    ```
    Running dfx start for version 0.16.1
    Initialized replica.
    Dashboard: http://localhost:37925/_/dashboard
    ```

5. Deploy canisters:
   
    Set up environment variables for encryption, ideally handled by Darkblock services in a production environment:
    ```bash
    AZLE_AUTORELOAD=true SECRET_KEY=bf2afddd019815653856e3cf224dced0ddefbbe5f64959d512e2ca42f7674ef4 dfx deploy
    ```

    You should see a successful deployment message:
    ```
    Deploying all canisters.
    Creating canisters...
    Creating canister darkblocks...
    darkblocks canister created with canister id: be2us-64aaa-aaaaa-qaabq-cai
    Building canisters...
    Executing 'npx azle darkblocks'
    Building canister darkblocks
    Done in 15.38s
    :tada: Canister darkblocks will be available at http://be2us-64aaa-aaaaa-qaabq-cai.localhost:8000
    Installing canisters...
    Creating UI canister on the local network.
    The UI canister on the "local" network is "br5f7-7uaaa-aaaaa-qaaca-cai"
    Installing code for canister darkblocks, with canister ID be2us-64aaa-aaaaa-qaabq-cai
    Deployed canisters.
    URLs:
      Backend canister via Candid interface:
        darkblocks: http://127.0.0.1:8000/?canisterId=br5f7-7uaaa-aaaaa-qaaca-cai&id=be2us-64aaa-aaaaa-qaabq-cai
    ```

---

## API Endpoints

Once deployed, the following methods are available:

### 1. **Create a Darkblock** (POST)
   Upload a file and mint a Darkblock:
   ```bash
   curl --location 'http://bkyz2-fmaaa-aaaaa-qaaaq-cai.localhost:8000/darkblock/create' \
   --form 'file=@small.png' \
   --form 'name="Darkblock x ICP Demo"' \
   --form 'creator_address="<your_creator_address>"' \
   --form 'nft_platform="Solana-Devnet"' \
   --form 'nft_standard="Metaplex"' -i
```

Success Response:
```json
{
  "darkblock_id": "your_darkblock_id",
  "message": "Darkblock Mint Successful!"
}
```

### 2. Get Decrypted File (GET)
Retrieve the decrypted file by its ID:
```bash
curl --location 'http://bkyz2-fmaaa-aaaaa-qaaaq-cai.localhost:8000/darkblock/decrypt/<darkblock_id>' --output decrypted_image.png
```

### 3. Get Metadata (GET)
Fetch metadata of a Darkblock:
```bash
curl --location 'http://bkyz2-fmaaa-aaaaa-qaaaq-cai.localhost:8000/darkblock/metadata/<darkblock_id>'
```

Success Response Example:

```json
{
  "metadata": {
    "id": "darkblock_id",
    "name": "Darkblock x ICP Demo",
    "creator_address": "ZBkPwZPuvY2v6BDkiqow3zUEKN8dmv5fzqzJLmHB2hv",
    "nft_platform": "Solana-Devnet",
    "nft_standard": "Metaplex",
    "filename": "small.png",
    "mimeType": "image/png",
    "size": 3131,
    "createdAt": "2024-09-10T08:43:43.695Z"
  }
}
```
