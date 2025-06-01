/**
 * Cross Chain ABI Definition
 * 
 * This file contains the Application Binary Interface (ABI) for the BNB Smart Chain 
 * Cross Chain Bridge contract. The ABI describes all the functions, events, and state 
 * variables of the contract to allow interaction from JavaScript applications.
 * 
 * The Cross Chain contract is a fundamental component of BNB Chain's cross-chain 
 * infrastructure, enabling communication between different blockchains in the BNB 
 * ecosystem (BNB Smart Chain, BNB Beacon Chain, Greenfield, opBNB, etc).
 * 
 * Key functionality includes:
 * - Sending cross-chain packages to other chains
 * - Receiving and processing cross-chain packages
 * - Managing communication channels between chains
 * - Handling acknowledgments for cross-chain messages
 * - Supporting governance operations for protocol upgrades
 * 
 * This contract works in conjunction with the TokenHub contract to enable the
 * complete cross-chain communication and token transfer functionality across
 * the BNB Chain ecosystem.
 * 
 * The ABI is defined as a constant to ensure type safety and immutability.
 */
export const CROSS_CHAIN_ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint8",
                name: "channelId",
                type: "uint8",
            },
            {
                indexed: false,
                internalType: "address",
                name: "contractAddr",
                type: "address",
            },
        ],
        name: "AddChannel",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint8",
                name: "version",
                type: "uint8",
            },
        ],
        name: "Initialized",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "string",
                name: "key",
                type: "string",
            },
            {
                indexed: false,
                internalType: "bytes",
                name: "value",
                type: "bytes",
            },
        ],
        name: "ParamChange",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint8",
                name: "channelId",
                type: "uint8",
            },
        ],
        name: "RemoveChannel",
        type: "event",
    },
    {
        inputs: [],
        name: "APP_CHANNELID",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "CROSS_CHAIN",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "GOV_CHANNELID",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "GOV_HUB",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "INCENTIVIZE_ADDR",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "LIGHT_CLIENT",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "PACKAGE_TX_TYPE",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "PROXY_ADMIN",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "RELAYER_HUB",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "SLASH_CHANNELID",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "SLASH_CONTRACT_ADDR",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "STAKING_CHANNELID",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "TOKEN_HUB",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "TOKEN_MANAGER",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "TRANSFER_IN_CHANNELID",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "TRANSFER_OUT_CHANNELID",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "VALIDATOR_CONTRACT_ADDR",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "channelId",
                type: "uint8",
            },
            {
                internalType: "address",
                name: "contractAddr",
                type: "address",
            },
        ],
        name: "addChannel",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_govHub",
                type: "address",
            },
            {
                internalType: "address",
                name: "_tokenHub",
                type: "address",
            },
            {
                internalType: "address",
                name: "_relayerHub",
                type: "address",
            },
            {
                internalType: "address",
                name: "_proxyAdmin",
                type: "address",
            },
            {
                internalType: "address",
                name: "_incentivizeAddr",
                type: "address",
            },
            {
                internalType: "address",
                name: "_tokenManager",
                type: "address",
            },
            {
                internalType: "address",
                name: "_validatorContractAddr",
                type: "address",
            },
            {
                internalType: "address",
                name: "_lightClientAddr",
                type: "address",
            },
            {
                internalType: "address",
                name: "_slashContractAddr",
                type: "address",
            },
        ],
        name: "initialize",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        name: "registeredContractChannelMap",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "channelId",
                type: "uint8",
            },
        ],
        name: "removeChannel",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "packageType",
                type: "uint8",
            },
            {
                internalType: "uint256",
                name: "relayFee",
                type: "uint256",
            },
            {
                internalType: "bytes",
                name: "msgBytes",
                type: "bytes",
            },
        ],
        name: "sendSynPackage",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "payable",
        type: "function",
    },
] as const;
