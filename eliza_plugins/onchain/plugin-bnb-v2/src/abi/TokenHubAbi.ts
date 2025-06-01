/**
 * TokenHub ABI Definition
 * 
 * This file contains the Application Binary Interface (ABI) for the BNB Smart Chain 
 * TokenHub contract. The ABI describes all the functions, events, and state 
 * variables of the contract to allow interaction from JavaScript applications.
 * 
 * The TokenHub contract is a core component of the BNB Chain cross-chain architecture,
 * responsible for handling token transfers between BNB Smart Chain (BSC) and other 
 * chains in the BNB ecosystem. It works closely with the Cross Chain contract to 
 * facilitate cross-chain token movements.
 * 
 * Key functionality includes:
 * - Native BNB token transfers between chains (transferOut)
 * - Handling of incoming token transfers (transferIn)
 * - Managing relay fees for cross-chain operations
 * - Processing acknowledgments for cross-chain transfers
 * - Handling refunds for failed transfers
 * 
 * Used primarily in bridging operations to move tokens between BSC, BNB Beacon Chain,
 * Greenfield, and opBNB.
 * 
 * The ABI is defined as a constant to ensure type safety and immutability.
 */
export const TOKENHUB_ABI = [
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
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "ReceiveTransferIn",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "refundAddr",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint32",
                name: "status",
                type: "uint32",
            },
        ],
        name: "RefundFailure",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "refundAddr",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint32",
                name: "status",
                type: "uint32",
            },
        ],
        name: "RefundSuccess",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "RewardTo",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "refundAddr",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "TransferInSuccess",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "senderAddr",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "relayFee",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "ackRelayFee",
                type: "uint256",
            },
        ],
        name: "TransferOutSuccess",
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
            {
                indexed: false,
                internalType: "bytes",
                name: "msgBytes",
                type: "bytes",
            },
        ],
        name: "UnexpectedPackage",
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
        name: "CODE_OK",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
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
        name: "ERROR_FAIL_DECODE",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
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
        name: "MAX_GAS_FOR_TRANSFER_BNB",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
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
        name: "REWARD_UPPER_LIMIT",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
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
        name: "TRANSFER_IN_FAILURE_INSUFFICIENT_BALANCE",
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
        name: "TRANSFER_IN_FAILURE_NON_PAYABLE_RECIPIENT",
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
        name: "TRANSFER_IN_FAILURE_UNKNOWN",
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
        name: "TRANSFER_IN_SUCCESS",
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
        inputs: [
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "claimRelayFee",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "govHub",
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
                internalType: "bytes",
                name: "msgBytes",
                type: "bytes",
            },
        ],
        name: "handleAckPackage",
        outputs: [],
        stateMutability: "nonpayable",
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
                internalType: "bytes",
                name: "msgBytes",
                type: "bytes",
            },
        ],
        name: "handleFailAckPackage",
        outputs: [],
        stateMutability: "nonpayable",
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
                internalType: "bytes",
                name: "msgBytes",
                type: "bytes",
            },
        ],
        name: "handleSynPackage",
        outputs: [
            {
                internalType: "bytes",
                name: "",
                type: "bytes",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "initialize",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "recipient",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "transferOut",
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
    {
        stateMutability: "payable",
        type: "receive",
    },
] as const;
