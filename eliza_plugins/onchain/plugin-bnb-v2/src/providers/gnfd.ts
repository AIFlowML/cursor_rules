import { createRequire } from "module";
import type { IAgentRuntime } from "@elizaos/core";

const require = createRequire(import.meta.url);
const { Client } = require("@bnb-chain/greenfield-js-sdk");

export const getGnfdConfig = async (runtime: IAgentRuntime) => {
    const network = runtime.getSetting("GREENFIELD_NETWORK");
    const config =
    network === "TESTNET" ? CONFIG["TESTNET"] : CONFIG["MAINNET"];

    return config
}

export const InitGnfdClient = async (runtime: IAgentRuntime) => {
    const config = await getGnfdConfig(runtime)
    if (!config.GREENFIELD_CHAIN_ID || !config.GREENFIELD_RPC_URL) {
        throw new Error("Creating greenfield client params is error");
    }

    const client = Client.create(
        config.GREENFIELD_RPC_URL,
        config.GREENFIELD_CHAIN_ID
    );

    return client;
};

export const CONFIG = {
    MAINNET: {
        NETWORK: "MAINNET",
        TOKENHUB_ADDRESS: "0xeA97dF87E6c7F68C9f95A69dA79E19B834823F25",
        CROSSCHAIN_ADDRESS: "0x77e719b714be09F70D484AB81F70D02B0E182f7d",
        GREENFIELD_RPC_URL: "https://greenfield-chain.bnbchain.org",
        GREENFIELD_CHAIN_ID: "1017",
        GREENFIELD_SCAN: 'https://greenfieldscan.com'
    },
    TESTNET: {
        NETWORK: "TESTNET",
        TOKENHUB_ADDRESS: "0xED8e5C546F84442219A5a987EE1D820698528E04",
        CROSSCHAIN_ADDRESS: "0xa5B2c9194131A4E0BFaCbF9E5D6722c873159cb7",
        GREENFIELD_RPC_URL:
            "https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org",
        GREENFIELD_CHAIN_ID: "5600",
        GREENFIELD_SCAN: 'https://testnet.greenfieldscan.com'
    },
};
