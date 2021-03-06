export const mainnetSCAddr = '0x76b074d91f546914c6765ef81cbdc6f9c7da5685';//mainnet smart contract
export const testnetSCAddr = '0xd8b67e4c66a4ab51fa8b7a30a82c63ff792b79c0';//testnet smart contract

// change networkId to switch network
export const networkId = 1; //1:mainnet, 3:testnet;

export const price = 10;

export const defaultStartBlock = 0;

export const scAddress = networkId === 1 ? mainnetSCAddr : testnetSCAddr;
