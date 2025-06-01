import {
  type Action,
  type ActionExample,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
  ModelType,
} from "@elizaos/core";
import { type Address, formatEther, parseEther, erc20Abi } from "viem";

import {
  bnbWalletProvider,
  initWalletProvider,
  type WalletProvider,
} from "../providers/wallet";
import { stakeTemplate } from "../templates";
import { ListaDaoAbi, type StakeParams, type StakeResponse, type SupportedChain } from "../types";
import { EXPLORERS } from "../constants";

export { stakeTemplate };

/**
 * StakeAction class - Handles staking operations on BNB Smart Chain
 * 
 * This class implements the core functionality for staking BNB, 
 * withdrawing staked tokens, and claiming rewards through Lista DAO.
 */
export class StakeAction {
  private readonly LISTA_DAO =
    "0x1adB950d8bB3dA4bE104211D5AB038628e477fE6" as const;
  private readonly SLIS_BNB =
    "0xB0b84D294e0C75A6abe60171b70edEb2EFd14A1B" as const;

  /**
   * Creates a new StakeAction instance
   * 
   * @param walletProvider - Provider for wallet operations
   */
  constructor(private walletProvider: WalletProvider) {}

  /**
   * Execute a staking operation with the provided parameters
   * 
   * @param params - Stake parameters including chain, action, and optional amount
   * @returns Stake response with operation result
   * @throws Error if stake operation fails
   */
  async stake(params: StakeParams): Promise<StakeResponse> {
    logger.debug("Starting stake action with params:", JSON.stringify(params, null, 2));
    
    // Validate parameters
    this.validateStakeParams(params);
    logger.debug("After validation, stake params:", JSON.stringify(params, null, 2));

    // Switch to BSC chain (only supported chain for staking)
    logger.debug("Switching to BSC chain for staking");
    this.walletProvider.switchChain("bsc");

    // Log contracts being used
    logger.debug(`Using Lista DAO contract: ${this.LISTA_DAO}`);
    logger.debug(`Using slisBNB token contract: ${this.SLIS_BNB}`);
    
    // Get wallet address
    const walletAddress = this.walletProvider.getAddress();
    logger.debug(`Wallet address: ${walletAddress}`);

    // Execute the requested action
    logger.debug(`Executing stake action: ${params.action}`);
    const actions = {
      deposit: async () => {
        if (!params.amount) {
          throw new Error("Amount is required for deposit");
        }
        logger.debug(`Depositing ${params.amount} BNB to Lista DAO`);
        return await this.doDeposit(params.amount);
      },
      withdraw: async () => {
        logger.debug(`Withdrawing ${params.amount || 'all'} slisBNB from Lista DAO`);
        return await this.doWithdraw(params.amount);
      },
      claim: async () => {
        logger.debug("Claiming unlocked BNB from Lista DAO");
        return await this.doClaim();
      },
    };
    
    try {
      const resp = await actions[params.action]();
      logger.debug(`Stake action completed successfully: ${resp}`);
      
      // Extract txHash from the response if present
      const txHash = resp.includes("Transaction Hash:") 
        ? resp.match(/Transaction Hash: (0x[a-fA-F0-9]{64})/)?.[1] 
        : undefined;
      
      return { 
        response: resp,
        txHash: txHash as `0x${string}` | undefined,
        action: params.action,
        amount: params.amount
      };
    } catch (error) {
      logger.error(`Error executing stake action ${params.action}:`, error);
      throw error;
    }
  }

  /**
   * Validates and normalizes stake parameters
   * 
   * @param params - The parameters to validate and normalize
   * @throws Error if parameters are invalid
   */
  validateStakeParams(params: StakeParams) {
    logger.debug(`Validating stake params: chain=${params.chain}, action=${params.action}, amount=${params.amount}`);
    
    // Validate chain
    if (!params.chain) {
      logger.debug("No chain specified, defaulting to bsc");
      params.chain = "bsc";
    } else if (params.chain !== "bsc") {
      logger.error(`Unsupported chain for staking: ${params.chain}`);
      throw new Error("Only BSC mainnet is supported for staking");
    }

    // Validate action
    if (!params.action) {
      logger.error("No action specified for staking");
      throw new Error("Action is required for staking. Use 'deposit', 'withdraw', or 'claim'");
    }
    
    const validActions = ["deposit", "withdraw", "claim"];
    if (!validActions.includes(params.action)) {
      logger.error(`Invalid staking action: ${params.action}`);
      throw new Error(`Invalid staking action: ${params.action}. Valid actions are: ${validActions.join(", ")}`);
    }

    // Validate amount for deposit and withdraw
    if (params.action === "deposit" && !params.amount) {
      logger.error("Amount is required for deposit");
      throw new Error("Amount is required for deposit");
    }

    if (params.action === "withdraw" && !params.amount) {
      logger.debug("No amount specified for withdraw, will withdraw all slisBNB");
    }
    
    // Validate amount format if provided
    if (params.amount) {
      try {
        const amountValue = Number.parseFloat(params.amount);
        if (Number.isNaN(amountValue) || amountValue <= 0) {
          logger.error(`Invalid amount: ${params.amount} (must be a positive number)`);
          throw new Error(`Invalid amount: ${params.amount}. Please provide a positive number.`);
        }
        logger.debug(`Amount validation passed: ${params.amount}`);
      } catch (error) {
        logger.error(`Failed to parse amount: ${params.amount}`, error);
        throw new Error(`Invalid amount format: ${params.amount}. Please provide a valid number.`);
      }
    }
  }

  /**
   * Deposits BNB into Lista DAO
   * 
   * @param amount - Amount of BNB to deposit
   * @returns Success message with transaction details
   * @throws Error if deposit fails
   */
  async doDeposit(amount: string): Promise<string> {
    logger.debug(`Starting deposit of ${amount} BNB to Lista DAO`);
    
    const publicClient = this.walletProvider.getPublicClient("bsc");
    const walletClient = this.walletProvider.getWalletClient("bsc");
    const account = walletClient.account;
    
    if (!account) {
      logger.error("Wallet account not found");
      throw new Error("Wallet account not found");
    }
    
    logger.debug(`Using account address: ${account.address}`);
    logger.debug(`Preparing to deposit ${amount} BNB with parseEther value: ${parseEther(amount)}`);

    try {
      // Simulate contract call before execution to catch any potential errors
      logger.debug("Simulating deposit transaction");
      const { request } = await publicClient.simulateContract({
        account: this.walletProvider.getAccount(),
        address: this.LISTA_DAO,
        abi: ListaDaoAbi,
        functionName: "deposit",
        value: parseEther(amount),
      });
      
      // Execute the deposit transaction
      logger.debug("Executing deposit transaction");
      const txHash = await walletClient.writeContract(request);
      logger.debug(`Deposit transaction submitted with hash: ${txHash}`);
      
      // Wait for transaction confirmation
      logger.debug("Waiting for transaction confirmation");
      await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      logger.debug(`Transaction confirmed: ${txHash}`);

      // Check the updated slisBNB balance
      logger.debug("Checking updated slisBNB balance");
      const slisBNBBalance = await publicClient.readContract({
        address: this.SLIS_BNB,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
      });
      
      const formattedBalance = formatEther(slisBNBBalance);
      logger.debug(`Updated slisBNB balance: ${formattedBalance}`);

      return `Successfully deposited ${amount} BNB. You now hold ${formattedBalance} slisBNB. \nTransaction Hash: ${txHash}`;
    } catch (error: unknown) {
      logger.error("Error during deposit operation:", error);
      
      // Provide more specific error messages
      const errorObj = error as Error;
      const errorMessage = errorObj.message || String(error);
      
      if (errorMessage.includes("insufficient funds")) {
        throw new Error(`Insufficient funds to deposit ${amount} BNB. Please check your balance.`);
      }
      
      if (errorMessage.includes("user rejected")) {
        throw new Error("Transaction rejected by user.");
      }
      
      // Re-throw the original error if no specific handling
      throw error;
    }
  }

  /**
   * Withdraws slisBNB from Lista DAO
   * 
   * @param amount - Optional amount of slisBNB to withdraw (if undefined, withdraws all)
   * @returns Success message with transaction details
   * @throws Error if withdrawal fails
   */
  async doWithdraw(amount?: string): Promise<string> {
    logger.debug(`Starting withdraw of ${amount || 'all'} slisBNB from Lista DAO`);
    
    const publicClient = this.walletProvider.getPublicClient("bsc");
    const walletClient = this.walletProvider.getWalletClient("bsc");
    const account = walletClient.account;
    
    if (!account) {
      logger.error("Wallet account not found");
      throw new Error("Wallet account not found");
    }
    
    logger.debug(`Using account address: ${account.address}`);

    try {
      // If amount is not provided, withdraw all slisBNB
      let amountToWithdraw: bigint;
      if (!amount) {
        logger.debug("No amount specified, checking total slisBNB balance");
        amountToWithdraw = await publicClient.readContract({
          address: this.SLIS_BNB,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [account.address],
        });
        logger.debug(`Total slisBNB balance to withdraw: ${formatEther(amountToWithdraw)}`);
      } else {
        amountToWithdraw = parseEther(amount);
        logger.debug(`Withdrawing specific amount: ${amount} slisBNB (${amountToWithdraw} wei)`);
      }
      
      // Check if there's anything to withdraw
      if (amountToWithdraw <= 0n) {
        logger.error(`No slisBNB to withdraw (amount: ${formatEther(amountToWithdraw)})`);
        throw new Error("No slisBNB tokens available to withdraw");
      }

      // Check slisBNB allowance
      logger.debug("Checking slisBNB allowance for Lista DAO contract");
      const allowance = await this.walletProvider.checkERC20Allowance(
        "bsc",
        this.SLIS_BNB,
        account.address,
        this.LISTA_DAO
      );
      logger.debug(`Current allowance: ${formatEther(allowance)}`);
      
      if (allowance < amountToWithdraw) {
        const neededAllowance = amountToWithdraw - allowance;
        logger.debug(`Increasing slisBNB allowance by ${formatEther(neededAllowance)}`);
        
        const txHash = await this.walletProvider.approveERC20(
          "bsc",
          this.SLIS_BNB,
          this.LISTA_DAO,
          amountToWithdraw
        );
        logger.debug(`Allowance approval transaction submitted with hash: ${txHash}`);
        
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        logger.debug("Allowance approval transaction confirmed");
      } else {
        logger.debug("Sufficient allowance already granted");
      }

      // Simulate the withdraw request
      logger.debug("Simulating withdraw request transaction");
      const { request } = await publicClient.simulateContract({
        account: this.walletProvider.getAccount(),
        address: this.LISTA_DAO,
        abi: ListaDaoAbi,
        functionName: "requestWithdraw",
        args: [amountToWithdraw],
      });
      
      // Execute the withdraw request
      logger.debug("Executing withdraw request transaction");
      const txHash = await walletClient.writeContract(request);
      logger.debug(`Withdraw request transaction submitted with hash: ${txHash}`);
      
      // Wait for transaction confirmation
      logger.debug("Waiting for transaction confirmation");
      await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      logger.debug(`Transaction confirmed: ${txHash}`);

      // Check remaining slisBNB balance
      logger.debug("Checking remaining slisBNB balance");
      const slisBNBBalance = await publicClient.readContract({
        address: this.SLIS_BNB,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
      });
      
      const formattedBalance = formatEther(slisBNBBalance);
      logger.debug(`Remaining slisBNB balance: ${formattedBalance}`);

      return `Successfully requested withdrawal of ${amount || formatEther(amountToWithdraw)} slisBNB. You have ${formattedBalance} slisBNB left. 
You can claim your BNB in 7-14 days using the 'claim' action.
Transaction Hash: ${txHash}`;
    } catch (error: unknown) {
      logger.error("Error during withdraw operation:", error);
      
      // Provide more specific error messages
      const errorObj = error as Error;
      const errorMessage = errorObj.message || String(error);
      
      if (errorMessage.includes("insufficient funds") || errorMessage.includes("insufficient balance")) {
        throw new Error("Insufficient slisBNB balance to withdraw. Please check your balance.");
      }
      
      if (errorMessage.includes("user rejected")) {
        throw new Error("Transaction rejected by user.");
      }
      
      // Re-throw the original error if no specific handling
      throw error;
    }
  }

  /**
   * Claims unlocked BNB from previous withdrawals
   * 
   * @returns Success message with amount claimed
   * @throws Error if claim fails
   */
  async doClaim(): Promise<string> {
    logger.debug("Starting claim operation for unlocked BNB from Lista DAO");
    
    const publicClient = this.walletProvider.getPublicClient("bsc");
    const walletClient = this.walletProvider.getWalletClient("bsc");
    const account = walletClient.account;
    
    if (!account) {
      logger.error("Wallet account not found");
      throw new Error("Wallet account not found");
    }
    
    logger.debug(`Using account address: ${account.address}`);

    try {
      // Get user's withdrawal requests
      logger.debug("Fetching user withdrawal requests");
      const requests = await publicClient.readContract({
        address: this.LISTA_DAO,
        abi: ListaDaoAbi,
        functionName: "getUserWithdrawalRequests",
        args: [account.address],
      });
      
      logger.debug(`Found ${requests.length} withdrawal requests`);
      
      if (requests.length === 0) {
        logger.warn("No withdrawal requests found for claiming");
        return `No withdrawal requests found to claim. You need to request a withdrawal first using the 'withdraw' action.`;
      }

      let totalClaimed = 0n;
      let claimedCount = 0;
      let lastTxHash = "";
      
      // Process each withdrawal request
      for (let idx = 0; idx < requests.length; idx++) {
        logger.debug(`Checking request #${idx} status`);
        const [isClaimable, amount] = await publicClient.readContract({
          address: this.LISTA_DAO,
          abi: ListaDaoAbi,
          functionName: "getUserRequestStatus",
          args: [account.address, BigInt(idx)],
        });

        if (isClaimable) {
          logger.debug(`Request #${idx} is claimable, amount: ${formatEther(amount)} BNB`);
          
          // Simulate the claim transaction
          logger.debug(`Simulating claim transaction for request #${idx}`);
          const { request } = await publicClient.simulateContract({
            account: this.walletProvider.getAccount(),
            address: this.LISTA_DAO,
            abi: ListaDaoAbi,
            functionName: "claimWithdraw",
            args: [BigInt(idx)],
          });

          // Execute the claim transaction
          logger.debug(`Executing claim transaction for request #${idx}`);
          const txHash = await walletClient.writeContract(request);
          logger.debug(`Claim transaction submitted with hash: ${txHash}`);
          
          // Wait for transaction confirmation
          logger.debug("Waiting for transaction confirmation");
          await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });
          logger.debug(`Transaction confirmed: ${txHash}`);

          totalClaimed += amount;
          claimedCount++;
          lastTxHash = txHash;
        } else {
          logger.debug(`Request #${idx} is not claimable yet, skipping`);
          break; // Requests are ordered, so once we hit a non-claimable one, we can stop
        }
      }

      const formattedTotal = formatEther(totalClaimed);
      logger.debug(`Total claimed: ${formattedTotal} BNB from ${claimedCount} requests`);
      
      if (claimedCount === 0) {
        return "No claimable withdrawals found. Withdrawal requests typically need 7-14 days to become claimable.";
      }

      return `Successfully claimed ${formattedTotal} BNB from ${claimedCount} withdrawal request(s).
Transaction Hash: ${lastTxHash}`;
    } catch (error: unknown) {
      logger.error("Error during claim operation:", error);
      
      // Provide more specific error messages
      const errorObj = error as Error;
      const errorMessage = errorObj.message || String(error);
      
      if (errorMessage.includes("user rejected")) {
        throw new Error("Transaction rejected by user.");
      }
      
      // Re-throw the original error if no specific handling
      throw error;
    }
  }
}

/**
 * Action for staking BNB on Lista DAO
 * 
 * This action handles deposit, withdraw, and claim operations for staking
 * BNB tokens on the Lista DAO platform on BNB Smart Chain.
 */
export const stakeAction: Action = {
  name: "STAKE_BNB",
  similes: [
    "DELEGATE_BNB", 
    "DEPOSIT_BNB", 
    "UNDELEGATE_BNB", 
    "UNSTAKE_BNB", 
    "WITHDRAW_BNB", 
    "CLAIM_BNB"
  ],
  description: "Stake BNB, withdraw staked tokens, or claim rewards from Lista DAO on BNB Smart Chain",
  validate: async (runtime: IAgentRuntime) => {
    const privateKey = runtime.getSetting("BNB_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: Record<string, unknown> = {},
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info("Executing STAKE_BNB action");
    logger.debug("Message content:", JSON.stringify(message.content, null, 2));

    // Extract prompt text for stake action analysis
    const promptText = typeof message.content.text === 'string' ? message.content.text.trim() : '';
    logger.debug(`Raw prompt text: "${promptText}"`);
    
    // Analyze prompt to detect stake actions directly
    const promptLower = promptText.toLowerCase();
    
    // Look for stake patterns in the prompt
    const stakeRegex = /(?:stake|deposit)\s+([0-9.]+)\s+(?:bnb|slisBNB)\s+(?:on|in|to|at)?(?:\s+lista\s+dao)?(?:\s+on)?\s+(?:bsc|binance)/i;
    const withdrawRegex = /(?:withdraw|unstake|undelegate)\s+([0-9.]+)\s+(?:bnb|slisBNB)\s+(?:from|on)?\s+(?:lista\s+dao)?(?:\s+on)?\s+(?:bsc|binance)/i;
    const claimRegex = /claim\s+(?:bnb|unlocked\s+bnb|rewards?)(?:\s+from)?\s+(?:lista\s+dao)?(?:\s+on)?\s+(?:bsc|binance)/i;
    
    let directAction: string | null = null;
    let directAmount: string | null = null;
    
    // Try to match stake pattern
    let match = promptText.match(stakeRegex);
    if (match && match.length >= 2) {
      directAction = "deposit";
      directAmount = match[1] || null;
      logger.debug(`Directly extracted deposit action - Amount: ${directAmount}`);
    } else {
      // Try to match withdraw pattern
      match = promptText.match(withdrawRegex);
      if (match && match.length >= 2) {
        directAction = "withdraw";
        directAmount = match[1] || null;
        logger.debug(`Directly extracted withdraw action - Amount: ${directAmount}`);
      } else {
        // Try to match claim pattern
        match = promptText.match(claimRegex);
        if (match) {
          directAction = "claim";
          logger.debug("Directly extracted claim action");
        }
      }
    }
    
    // Check for action keywords
    if (!directAction) {
      if (promptLower.includes("stake") || promptLower.includes("deposit")) {
        directAction = "deposit";
        logger.debug("Detected stake/deposit action from keywords");
      } else if (promptLower.includes("withdraw") || promptLower.includes("unstake") || promptLower.includes("undelegate")) {
        directAction = "withdraw";
        logger.debug("Detected withdraw/unstake action from keywords");
      } else if (promptLower.includes("claim")) {
        directAction = "claim";
        logger.debug("Detected claim action from keywords");
      }
    }
    
    // Extract numeric values if not already found
    if (!directAmount && directAction !== "claim") {
      const amountRegex = /([0-9]+(?:\.[0-9]+)?)/;
      const amountMatch = promptText.match(amountRegex);
      if (amountMatch && amountMatch.length >= 2) {
        directAmount = amountMatch[1] || null;
        logger.debug(`Extracted amount from prompt: ${directAmount}`);
      }
    }
    
    // Store prompt analysis results
    const promptAnalysis = {
      directAction,
      directAmount,
      containsBNB: promptLower.includes("bnb"),
      containsListaDAO: promptLower.includes("lista") || promptLower.includes("dao"),
      containsBSC: promptLower.includes("bsc") || promptLower.includes("binance")
    };
    
    logger.debug("Prompt analysis result:", promptAnalysis);

    // Validate stake
    if (!(message.content.source === "direct" || message.content.source === "client_chat:user")) {
      logger.warn("Stake rejected: invalid source:", message.content.source);
      callback?.({
        text: "I can't do that for you.",
        content: { error: "Stake not allowed" },
      });
      return false;
    }
    logger.debug("Source validation passed");

    // Initialize or update state
    const currentState = state ? state : (await runtime.composeState(message)) as State;
    
    try {
      // Only create walletInfo if state exists
      if (state) {
        state.walletInfo = await bnbWalletProvider.get(
          runtime,
          message,
          currentState
        );
        logger.debug("Wallet info:", state.walletInfo);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error getting wallet info:", errorMessage);
      callback?.({
        text: `Unable to access wallet: ${errorMessage}`,
        content: { error: errorMessage },
      });
      return false;
    }

    // Use runtime model to get stake parameters
    const stakePrompt = {
      template: stakeTemplate,
      state: currentState
    };

    const mlOutput = await runtime.useModel(ModelType.LARGE, { 
      prompt: JSON.stringify(stakePrompt),
      responseFormat: { type: "json_object" }
    });
    
    // Parse the JSON output
    let content: Record<string, unknown> = {};
    try {
      content = typeof mlOutput === 'string' ? JSON.parse(mlOutput) : mlOutput as Record<string, unknown>;
    } catch (error) {
      logger.error("Failed to parse model output as JSON:", mlOutput);
    }
    
    logger.debug("Generated stake content:", JSON.stringify(content, null, 2));
    
    // PRIORITY ORDER FOR ACTION DETERMINATION:
    // 1. Direct match from prompt text (most reliable)
    // 2. Action specified in model-generated content
    // 3. Default to deposit
    
    let stakeAction: string;
    let amount: string | undefined;
    
    // 1. First priority: Use directly extracted action from prompt if available
    if (directAction) {
      stakeAction = directAction;
      logger.debug(`Using action directly extracted from prompt: ${stakeAction}`);
    }
    // 2. Second priority: Use action from content if available
    else if (content.action && typeof content.action === 'string') {
      stakeAction = content.action;
      logger.debug(`Using action from generated content: ${stakeAction}`);
    }
    // 3. Default fallback
    else {
      stakeAction = "deposit"; // Default action
      logger.debug("No action detected, defaulting to deposit");
    }
    
    // Determine amount (if needed)
    if (stakeAction !== "claim") {
      // For deposit and withdraw, amount is needed
      if (directAmount) {
        amount = directAmount;
        logger.debug(`Using amount directly extracted from prompt: ${amount}`);
      } else if (content.amount && 
        (typeof content.amount === 'string' || typeof content.amount === 'number')) {
        amount = String(content.amount);
        logger.debug(`Using amount from generated content: ${amount}`);
      } else if (stakeAction === "deposit") {
        amount = "0.001"; // Default small amount for deposit
        logger.debug(`No amount detected for deposit, defaulting to ${amount}`);
      }
      // For withdraw, undefined amount is valid (withdraws all)
    }

    const walletProvider = initWalletProvider(runtime);
    const action = new StakeAction(walletProvider);
    const paramOptions: StakeParams = {
      chain: "bsc" as SupportedChain, // Only BSC is supported for staking
      action: stakeAction as "deposit" | "withdraw" | "claim",
      amount: amount,
    };
    
    logger.debug("Final stake options:", JSON.stringify(paramOptions, null, 2));
    
    try {
      logger.debug("Calling stake with params:", JSON.stringify(paramOptions, null, 2));
      const stakeResp = await action.stake(paramOptions);
      
      // Get block explorer URL for the transaction if available
      let txExplorerUrl: string | undefined = undefined;
      let walletExplorerUrl: string | undefined = undefined;
      
      if (stakeResp.txHash) {
        // BSC is the only supported chain for staking
        const explorerInfo = EXPLORERS.BSC;
        txExplorerUrl = `${explorerInfo.url}/tx/${stakeResp.txHash}`;
        walletExplorerUrl = `${explorerInfo.url}/address/${walletProvider.getAddress()}`;
        
        logger.debug(`Transaction explorer URL: ${txExplorerUrl}`);
        logger.debug(`Wallet explorer URL: ${walletExplorerUrl}`);
      }
      
      // Create response with additional information
      const textResponse = `${stakeResp.response}${
        txExplorerUrl ? `\n\nView transaction: ${txExplorerUrl}` : ""
      }${walletExplorerUrl ? `\nView wallet: ${walletExplorerUrl}` : ""}`;
      
      callback?.({
        text: textResponse,
        content: { 
          ...stakeResp,
          txExplorerUrl,
          walletExplorerUrl
        },
      });

      return true;
    } catch (error: unknown) {
      const errorObj = error as Error;
      logger.error("Error during stake:", errorObj.message || String(error));
      
      // Log the entire error object for diagnosis
      try {
        logger.error("Full error details:", JSON.stringify(error, null, 2));
      } catch (e) {
        logger.error("Error object not serializable, logging properties individually:");
        if (errorObj && typeof errorObj === 'object') {
          // Convert to unknown first, then to a safer type for indexing
          const errorAsRecord = Object.entries(errorObj as unknown as Record<string, unknown>)
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {} as Record<string, unknown>);
            
          for (const [key, value] of Object.entries(errorAsRecord)) {
            try {
              logger.error(`${key}:`, value);
            } catch (e) {
              logger.error(`${key}: [Error serializing property]`);
            }
          }
        }
      }
      
      // Provide more user-friendly error messages
      let errorMessage = errorObj.message || String(error);
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for the stake operation. Please check your balance and try with a smaller amount.";
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transaction was rejected. Please try again if you want to proceed with the stake operation.";
        } else if (errorMessage.includes("No withdrawal requests")) {
          errorMessage = "No withdrawal requests found to claim. You need to request a withdrawal first using the 'withdraw' action.";
        }
      }
      
      callback?.({
        text: `Stake failed: ${errorMessage}`,
        content: { 
          error: errorMessage,
          action: paramOptions.action,
          amount: paramOptions.amount 
        },
      });
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Stake 0.001 BNB on BSC",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you stake 0.001 BNB to Lista DAO on BSC",
          actions: ["STAKE_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Deposit 0.001 BNB to Lista DAO",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you deposit 0.001 BNB to Lista DAO on BSC",
          actions: ["STAKE_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Undelegate 0.001 slisBNB on BSC",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you undelegate 0.001 slisBNB from Lista DAO on BSC",
          actions: ["STAKE_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Withdraw 0.001 slisBNB from Lista DAO",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you withdraw 0.001 slisBNB from Lista DAO on BSC",
          actions: ["STAKE_BNB"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Claim unlocked BNB from Lista DAO",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll help you claim unlocked BNB from Lista DAO on BSC",
          actions: ["STAKE_BNB"],
        },
      },
    ],
  ] as ActionExample[][],
}; 