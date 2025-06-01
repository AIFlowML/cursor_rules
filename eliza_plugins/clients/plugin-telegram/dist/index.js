// src/constants.ts
var MESSAGE_CONSTANTS = {
  MAX_MESSAGES: 50,
  RECENT_MESSAGE_COUNT: 5,
  CHAT_HISTORY_COUNT: 10,
  DEFAULT_SIMILARITY_THRESHOLD: 0.6,
  DEFAULT_SIMILARITY_THRESHOLD_FOLLOW_UPS: 0.4,
  INTEREST_DECAY_TIME: 5 * 60 * 1e3,
  // 5 minutes
  PARTIAL_INTEREST_DECAY: 3 * 60 * 1e3
  // 3 minutes
};
var TELEGRAM_SERVICE_NAME = "telegram";

// src/service.ts
import {
  ChannelType as ChannelType2,
  EventType as EventType2,
  Role,
  Service,
  createUniqueUuid as createUniqueUuid2,
  logger as logger2
} from "@elizaos/core";
import { Telegraf } from "telegraf";

// src/environment.ts
import { z } from "zod";
var telegramEnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required")
});
async function validateTelegramConfig(runtime) {
  try {
    const config = {
      TELEGRAM_BOT_TOKEN: runtime.getSetting("TELEGRAM_BOT_TOKEN") || process.env.TELEGRAM_BOT_TOKEN
    };
    return telegramEnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n");
      throw new Error(`Telegram configuration validation failed:
${errorMessages}`);
    }
    throw error;
  }
}

// src/messageManager.ts
import {
  ChannelType,
  EventType,
  ModelType,
  createUniqueUuid,
  logger
} from "@elizaos/core";

// src/utils.ts
import { Markup } from "telegraf";
function escapeMarkdown(text) {
  if (text.startsWith("```") && text.endsWith("```")) {
    return text;
  }
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return part;
    }
    return part.replace(/`.*?`/g, (match) => match).replace(/([*_`\\])/g, "\\$1");
  }).join("");
}
function convertToTelegramButtons(buttons) {
  if (!buttons) return [];
  return buttons.map((button) => {
    switch (button.kind) {
      case "login":
        return Markup.button.login(button.text, button.url);
      case "url":
        return Markup.button.url(button.text, button.url);
    }
  });
}

// src/messageManager.ts
import { Markup as Markup2 } from "telegraf";
import fs from "node:fs";
var MAX_MESSAGE_LENGTH = 4096;
var getChannelType = (chat) => {
  if (chat.type === "private") return ChannelType.DM;
  if (chat.type === "supergroup") return ChannelType.GROUP;
  if (chat.type === "channel") return ChannelType.GROUP;
  if (chat.type === "group") return ChannelType.GROUP;
};
var MessageManager = class {
  bot;
  runtime;
  /**
   * Constructor for creating a new instance of a BotAgent.
   *
   * @param {Telegraf<Context>} bot - The Telegraf instance used for interacting with the bot platform.
   * @param {IAgentRuntime} runtime - The runtime environment for the agent.
   */
  constructor(bot, runtime) {
    this.bot = bot;
    this.runtime = runtime;
  }
  // Process image messages and generate descriptions
  /**
   * Process an image from a Telegram message to extract the image URL and description.
   *
   * @param {Message} message - The Telegram message object containing the image.
   * @returns {Promise<{ description: string } | null>} The description of the processed image or null if no image found.
   */
  async processImage(message) {
    var _a, _b, _c;
    try {
      let imageUrl = null;
      logger.info(`Telegram Message: ${message}`);
      if ("photo" in message && ((_a = message.photo) == null ? void 0 : _a.length) > 0) {
        const photo = message.photo[message.photo.length - 1];
        const fileLink = await this.bot.telegram.getFileLink(photo.file_id);
        imageUrl = fileLink.toString();
      } else if ("document" in message && ((_c = (_b = message.document) == null ? void 0 : _b.mime_type) == null ? void 0 : _c.startsWith("image/"))) {
        const fileLink = await this.bot.telegram.getFileLink(message.document.file_id);
        imageUrl = fileLink.toString();
      }
      if (imageUrl) {
        const { title, description } = await this.runtime.useModel(
          ModelType.IMAGE_DESCRIPTION,
          imageUrl
        );
        return { description: `[Image: ${title}
${description}]` };
      }
    } catch (error) {
      console.error("\u274C Error processing image:", error);
    }
    return null;
  }
  // Send long messages in chunks
  /**
   * Sends a message in chunks, handling attachments and splitting the message if necessary
   *
   * @param {Context} ctx - The context object representing the current state of the bot
   * @param {TelegramContent} content - The content of the message to be sent
   * @param {number} [replyToMessageId] - The ID of the message to reply to, if any
   * @returns {Promise<Message.TextMessage[]>} - An array of TextMessage objects representing the messages sent
   */
  async sendMessageInChunks(ctx, content, replyToMessageId) {
    if (content.attachments && content.attachments.length > 0) {
      content.attachments.map(async (attachment) => {
        const typeMap = {
          "image/gif": "animation" /* ANIMATION */,
          image: "photo" /* PHOTO */,
          doc: "document" /* DOCUMENT */,
          video: "video" /* VIDEO */,
          audio: "audio" /* AUDIO */
        };
        let mediaType = void 0;
        for (const prefix in typeMap) {
          if (attachment.contentType.startsWith(prefix)) {
            mediaType = typeMap[prefix];
            break;
          }
        }
        if (!mediaType) {
          throw new Error(
            `Unsupported Telegram attachment content type: ${attachment.contentType}`
          );
        }
        await this.sendMedia(ctx, attachment.url, mediaType, attachment.description);
      });
    } else {
      const chunks = this.splitMessage(content.text);
      const sentMessages = [];
      const telegramButtons = convertToTelegramButtons(content.buttons ?? []);
      await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
      for (let i = 0; i < chunks.length; i++) {
        const chunk = escapeMarkdown(chunks[i]);
        const sentMessage = await ctx.telegram.sendMessage(ctx.chat.id, chunk, {
          reply_parameters: i === 0 && replyToMessageId ? { message_id: replyToMessageId } : void 0,
          parse_mode: "Markdown",
          ...Markup2.inlineKeyboard(telegramButtons)
        });
        sentMessages.push(sentMessage);
      }
      return sentMessages;
    }
  }
  /**
   * Sends media to a chat using the Telegram API.
   *
   * @param {Context} ctx - The context object containing information about the current chat.
   * @param {string} mediaPath - The path to the media to be sent, either a URL or a local file path.
   * @param {MediaType} type - The type of media being sent (PHOTO, VIDEO, DOCUMENT, AUDIO, or ANIMATION).
   * @param {string} [caption] - Optional caption for the media being sent.
   *
   * @returns {Promise<void>} A Promise that resolves when the media is successfully sent.
   */
  async sendMedia(ctx, mediaPath, type, caption) {
    try {
      const isUrl = /^(http|https):\/\//.test(mediaPath);
      const sendFunctionMap = {
        ["photo" /* PHOTO */]: ctx.telegram.sendPhoto.bind(ctx.telegram),
        ["video" /* VIDEO */]: ctx.telegram.sendVideo.bind(ctx.telegram),
        ["document" /* DOCUMENT */]: ctx.telegram.sendDocument.bind(ctx.telegram),
        ["audio" /* AUDIO */]: ctx.telegram.sendAudio.bind(ctx.telegram),
        ["animation" /* ANIMATION */]: ctx.telegram.sendAnimation.bind(ctx.telegram)
      };
      const sendFunction = sendFunctionMap[type];
      if (!sendFunction) {
        throw new Error(`Unsupported media type: ${type}`);
      }
      if (isUrl) {
        await sendFunction(ctx.chat.id, mediaPath, { caption });
      } else {
        if (!fs.existsSync(mediaPath)) {
          throw new Error(`File not found at path: ${mediaPath}`);
        }
        const fileStream = fs.createReadStream(mediaPath);
        try {
          await sendFunction(ctx.chat.id, { source: fileStream }, { caption });
        } finally {
          fileStream.destroy();
        }
      }
      logger.info(
        `${type.charAt(0).toUpperCase() + type.slice(1)} sent successfully: ${mediaPath}`
      );
    } catch (error) {
      logger.error(`Failed to send ${type}. Path: ${mediaPath}. Error: ${error.message}`);
      logger.debug(error.stack);
      throw error;
    }
  }
  // Split message into smaller parts
  /**
   * Splits a given text into an array of strings based on the maximum message length.
   *
   * @param {string} text - The text to split into chunks.
   * @returns {string[]} An array of strings with each element representing a chunk of the original text.
   */
  splitMessage(text) {
    const chunks = [];
    let currentChunk = "";
    const lines = text.split("\n");
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 <= MAX_MESSAGE_LENGTH) {
        currentChunk += (currentChunk ? "\n" : "") + line;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = line;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }
  // Main handler for incoming messages
  /**
   * Handle incoming messages from Telegram and process them accordingly.
   * @param {Context} ctx - The context object containing information about the message.
   * @returns {Promise<void>}
   */
  async handleMessage(ctx) {
    var _a, _b, _c, _d, _e, _f;
    if (!ctx.message || !ctx.from) return;
    const message = ctx.message;
    try {
      const entityId = createUniqueUuid(this.runtime, ctx.from.id.toString());
      const threadId = "is_topic_message" in message && message.is_topic_message ? (_a = message.message_thread_id) == null ? void 0 : _a.toString() : void 0;
      const roomId = createUniqueUuid(
        this.runtime,
        threadId ? `${ctx.chat.id}-${threadId}` : ctx.chat.id.toString()
      );
      const messageId = createUniqueUuid(this.runtime, (_b = message == null ? void 0 : message.message_id) == null ? void 0 : _b.toString());
      const imageInfo = await this.processImage(message);
      let messageText = "";
      if ("text" in message && message.text) {
        messageText = message.text;
      } else if ("caption" in message && message.caption) {
        messageText = message.caption;
      }
      const fullText = imageInfo ? `${messageText} ${imageInfo.description}` : messageText;
      if (!fullText) return;
      const chat = message.chat;
      const channelType = getChannelType(chat);
      const memory = {
        id: messageId,
        entityId,
        agentId: this.runtime.agentId,
        roomId,
        content: {
          text: fullText,
          source: "telegram",
          channelType,
          inReplyTo: "reply_to_message" in message && message.reply_to_message ? createUniqueUuid(this.runtime, message.reply_to_message.message_id.toString()) : void 0
        },
        createdAt: message.date * 1e3
      };
      const callback = async (content, _files) => {
        try {
          if (!content.text) return [];
          const sentMessages = await this.sendMessageInChunks(ctx, content, message.message_id);
          if (!sentMessages) return [];
          const memories = [];
          for (let i = 0; i < sentMessages.length; i++) {
            const sentMessage = sentMessages[i];
            const _isLastMessage = i === sentMessages.length - 1;
            const responseMemory = {
              id: createUniqueUuid(this.runtime, sentMessage.message_id.toString()),
              entityId: this.runtime.agentId,
              agentId: this.runtime.agentId,
              roomId,
              content: {
                ...content,
                text: sentMessage.text,
                inReplyTo: messageId,
                channelType
              },
              createdAt: sentMessage.date * 1e3
            };
            await this.runtime.createMemory(responseMemory, "messages");
            memories.push(responseMemory);
          }
          return memories;
        } catch (error) {
          logger.error("Error in message callback:", error);
          return [];
        }
      };
      this.runtime.emitEvent(EventType.MESSAGE_RECEIVED, {
        runtime: this.runtime,
        message: memory,
        callback,
        source: "telegram"
      });
      this.runtime.emitEvent("TELEGRAM_MESSAGE_RECEIVED" /* MESSAGE_RECEIVED */, {
        runtime: this.runtime,
        message: memory,
        callback,
        source: "telegram",
        ctx,
        originalMessage: message
      });
    } catch (error) {
      logger.error("Error handling Telegram message:", {
        error,
        chatId: (_c = ctx.chat) == null ? void 0 : _c.id,
        messageId: (_d = ctx.message) == null ? void 0 : _d.message_id,
        from: ((_e = ctx.from) == null ? void 0 : _e.username) || ((_f = ctx.from) == null ? void 0 : _f.id)
      });
      throw error;
    }
  }
  /**
   * Handles the reaction event triggered by a user reacting to a message.
   * @param {NarrowedContext<Context<Update>, Update.MessageReactionUpdate>} ctx The context of the message reaction update
   * @returns {Promise<void>} A Promise that resolves when the reaction handling is complete
   */
  async handleReaction(ctx) {
    if (!ctx.update.message_reaction || !ctx.from) return;
    const reaction = ctx.update.message_reaction;
    const reactionType = reaction.new_reaction[0].type;
    const reactionEmoji = reaction.new_reaction[0].type;
    try {
      const entityId = createUniqueUuid(this.runtime, ctx.from.id.toString());
      const roomId = createUniqueUuid(this.runtime, ctx.chat.id.toString());
      const reactionId = createUniqueUuid(
        this.runtime,
        `${reaction.message_id}-${ctx.from.id}-${Date.now()}`
      );
      const memory = {
        id: reactionId,
        entityId,
        agentId: this.runtime.agentId,
        roomId,
        content: {
          channelType: getChannelType(reaction.chat),
          text: `Reacted with: ${reactionType === "emoji" ? reactionEmoji : reactionType}`,
          source: "telegram",
          inReplyTo: createUniqueUuid(this.runtime, reaction.message_id.toString())
        },
        createdAt: Date.now()
      };
      const callback = async (content) => {
        try {
          const sentMessage = await ctx.reply(content.text);
          const responseMemory = {
            id: createUniqueUuid(this.runtime, sentMessage.message_id.toString()),
            entityId: this.runtime.agentId,
            agentId: this.runtime.agentId,
            roomId,
            content: {
              ...content,
              inReplyTo: reactionId
            },
            createdAt: sentMessage.date * 1e3
          };
          return [responseMemory];
        } catch (error) {
          logger.error("Error in reaction callback:", error);
          return [];
        }
      };
      this.runtime.emitEvent(EventType.REACTION_RECEIVED, {
        runtime: this.runtime,
        message: memory,
        callback,
        source: "telegram"
      });
      this.runtime.emitEvent("TELEGRAM_REACTION_RECEIVED" /* REACTION_RECEIVED */, {
        runtime: this.runtime,
        message: memory,
        callback,
        source: "telegram",
        ctx,
        reactionString: reactionType === "emoji" ? reactionEmoji : reactionType,
        originalReaction: reaction.new_reaction[0]
      });
    } catch (error) {
      logger.error("Error handling reaction:", error);
    }
  }
  /**
   * Sends a message to a Telegram chat and emits appropriate events
   * @param {number | string} chatId - The Telegram chat ID to send the message to
   * @param {Content} content - The content to send
   * @param {number} [replyToMessageId] - Optional message ID to reply to
   * @returns {Promise<Message.TextMessage[]>} The sent messages
   */
  async sendMessage(chatId, content, replyToMessageId) {
    try {
      const ctx = {
        chat: { id: chatId },
        telegram: this.bot.telegram
      };
      const sentMessages = await this.sendMessageInChunks(
        ctx,
        content,
        replyToMessageId
      );
      if (!(sentMessages == null ? void 0 : sentMessages.length)) return [];
      const roomId = createUniqueUuid(this.runtime, chatId.toString());
      const memories = [];
      for (const sentMessage of sentMessages) {
        const memory = {
          id: createUniqueUuid(this.runtime, sentMessage.message_id.toString()),
          entityId: this.runtime.agentId,
          agentId: this.runtime.agentId,
          roomId,
          content: {
            ...content,
            text: sentMessage.text,
            source: "telegram",
            channelType: getChannelType({
              id: typeof chatId === "string" ? Number.parseInt(chatId, 10) : chatId,
              type: "private"
              // Default to private, will be overridden if in context
            })
          },
          createdAt: sentMessage.date * 1e3
        };
        await this.runtime.createMemory(memory, "messages");
        memories.push(memory);
      }
      this.runtime.emitEvent(EventType.MESSAGE_SENT, {
        runtime: this.runtime,
        message: {
          content
        },
        roomId,
        source: "telegram"
      });
      this.runtime.emitEvent("TELEGRAM_MESSAGE_SENT" /* MESSAGE_SENT */, {
        originalMessages: sentMessages,
        chatId
      });
      return sentMessages;
    } catch (error) {
      logger.error("Error sending message to Telegram:", error);
      return [];
    }
  }
};

// src/service.ts
var TelegramService = class _TelegramService extends Service {
  static serviceType = TELEGRAM_SERVICE_NAME;
  capabilityDescription = "The agent is able to send and receive messages on telegram";
  bot;
  messageManager;
  options;
  knownChats = /* @__PURE__ */ new Map();
  syncedEntityIds = /* @__PURE__ */ new Set();
  /**
   * Constructor for TelegramService class.
   * @param {IAgentRuntime} runtime - The runtime object for the agent.
   */
  constructor(runtime) {
    super(runtime);
    logger2.log("\u{1F4F1} Constructing new TelegramService...");
    this.options = {
      telegram: {
        apiRoot: runtime.getSetting("TELEGRAM_API_ROOT") || process.env.TELEGRAM_API_ROOT || "https://api.telegram.org"
      }
    };
    const botToken = runtime.getSetting("TELEGRAM_BOT_TOKEN");
    this.bot = new Telegraf(botToken, this.options);
    this.messageManager = new MessageManager(this.bot, this.runtime);
    logger2.log("\u2705 TelegramService constructor completed");
  }
  /**
   * Starts the Telegram service for the given runtime.
   *
   * @param {IAgentRuntime} runtime - The agent runtime to start the Telegram service for.
   * @returns {Promise<TelegramService>} A promise that resolves with the initialized TelegramService.
   */
  static async start(runtime) {
    await validateTelegramConfig(runtime);
    const maxRetries = 5;
    let retryCount = 0;
    let lastError = null;
    while (retryCount < maxRetries) {
      try {
        const service = new _TelegramService(runtime);
        logger2.success(
          `\u2705 Telegram client successfully started for character ${runtime.character.name}`
        );
        logger2.log("\u{1F680} Starting Telegram bot...");
        await service.initializeBot();
        service.setupMiddlewares();
        service.setupMessageHandlers();
        await service.bot.telegram.getMe();
        return service;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger2.error(
          `Telegram initialization attempt ${retryCount + 1} failed: ${lastError.message}`
        );
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = 2 ** retryCount * 1e3;
          logger2.info(`Retrying Telegram initialization in ${delay / 1e3} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw new Error(
      `Telegram initialization failed after ${maxRetries} attempts. Last error: ${lastError == null ? void 0 : lastError.message}`
    );
  }
  /**
   * Stops the agent runtime.
   * @param {IAgentRuntime} runtime - The agent runtime to stop
   */
  static async stop(runtime) {
    const tgClient = runtime.getService(TELEGRAM_SERVICE_NAME);
    if (tgClient) {
      await tgClient.stop();
    }
  }
  /**
   * Asynchronously stops the bot.
   *
   * @returns A Promise that resolves once the bot has stopped.
   */
  async stop() {
    this.bot.stop();
  }
  /**
   * Initializes the Telegram bot by launching it, getting bot info, and setting up message manager.
   * @returns {Promise<void>} A Promise that resolves when the initialization is complete.
   */
  async initializeBot() {
    this.bot.launch({
      dropPendingUpdates: true,
      allowedUpdates: ["message", "message_reaction"]
    });
    const botInfo = await this.bot.telegram.getMe();
    logger2.log(`Bot info: ${JSON.stringify(botInfo)}`);
    process.once("SIGINT", () => this.bot.stop("SIGINT"));
    process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
  }
  /**
   * Sets up the middleware chain for preprocessing messages before they reach handlers.
   * This critical method establishes a sequential processing pipeline that:
   *
   * 1. Authorization - Verifies if a chat is allowed to interact with the bot based on configured settings
   * 2. Chat Discovery - Ensures chat entities and worlds exist in the runtime, creating them if needed
   * 3. Forum Topics - Handles Telegram forum topics as separate rooms for better conversation management
   * 4. Entity Synchronization - Ensures message senders are properly synchronized as entities
   *
   * The middleware chain runs in sequence for each message, with each step potentially
   * enriching the context or stopping processing if conditions aren't met.
   * This preprocessing is essential for maintaining consistent state before message handlers execute.
   *
   * @private
   */
  setupMiddlewares() {
    this.bot.use(this.authorizationMiddleware.bind(this));
    this.bot.use(this.chatAndEntityMiddleware.bind(this));
  }
  /**
   * Authorization middleware - checks if chat is allowed to interact with the bot
   * based on the TELEGRAM_ALLOWED_CHATS configuration.
   *
   * @param {Context} ctx - The context of the incoming update
   * @param {Function} next - The function to call to proceed to the next middleware
   * @returns {Promise<void>}
   * @private
   */
  async authorizationMiddleware(ctx, next) {
    if (!await this.isGroupAuthorized(ctx)) {
      logger2.debug("Chat not authorized, skipping message processing");
      return;
    }
    await next();
  }
  /**
   * Chat and entity management middleware - handles new chats, forum topics, and entity synchronization.
   * This middleware implements decision logic to determine which operations are needed based on
   * the chat type and whether we've seen this chat before.
   *
   * @param {Context} ctx - The context of the incoming update
   * @param {Function} next - The function to call to proceed to the next middleware
   * @returns {Promise<void>}
   * @private
   */
  async chatAndEntityMiddleware(ctx, next) {
    if (!ctx.chat) return next();
    const chatId = ctx.chat.id.toString();
    if (!this.knownChats.has(chatId)) {
      await this.handleNewChat(ctx);
      return next();
    }
    await this.processExistingChat(ctx);
    await next();
  }
  /**
   * Process an existing chat based on chat type and message properties.
   * Different chat types require different processing steps.
   *
   * @param {Context} ctx - The context of the incoming update
   * @returns {Promise<void>}
   * @private
   */
  async processExistingChat(ctx) {
    var _a;
    if (!ctx.chat) return;
    const chat = ctx.chat;
    if (chat.type === "supergroup" && chat.is_forum && ((_a = ctx.message) == null ? void 0 : _a.message_thread_id)) {
      try {
        await this.handleForumTopic(ctx);
      } catch (error) {
        logger2.error(`Error handling forum topic: ${error}`);
      }
    }
    if (ctx.from && ctx.chat.type !== "private") {
      await this.syncEntity(ctx);
    }
  }
  /**
   * Sets up message and reaction handlers for the bot.
   * Configures event handlers to process incoming messages and reactions.
   *
   * @private
   */
  setupMessageHandlers() {
    this.bot.on("message", async (ctx) => {
      try {
        await this.messageManager.handleMessage(ctx);
      } catch (error) {
        logger2.error("Error handling message:", error);
      }
    });
    this.bot.on("message_reaction", async (ctx) => {
      try {
        await this.messageManager.handleReaction(ctx);
      } catch (error) {
        logger2.error("Error handling reaction:", error);
      }
    });
  }
  /**
   * Checks if a group is authorized, based on the TELEGRAM_ALLOWED_CHATS setting.
   * @param {Context} ctx - The context of the incoming update.
   * @returns {Promise<boolean>} A Promise that resolves with a boolean indicating if the group is authorized.
   */
  async isGroupAuthorized(ctx) {
    var _a;
    const chatId = (_a = ctx.chat) == null ? void 0 : _a.id.toString();
    if (!chatId) return false;
    const allowedChats = this.runtime.getSetting("TELEGRAM_ALLOWED_CHATS");
    if (!allowedChats) {
      return true;
    }
    try {
      const allowedChatsList = JSON.parse(allowedChats);
      return allowedChatsList.includes(chatId);
    } catch (error) {
      logger2.error("Error parsing TELEGRAM_ALLOWED_CHATS:", error);
      return false;
    }
  }
  /**
   * Synchronizes an entity from a message context with the runtime system.
   * This method handles three cases:
   * 1. Message sender - most common case
   * 2. New chat member - when a user joins the chat
   * 3. Left chat member - when a user leaves the chat
   *
   * @param {Context} ctx - The context of the incoming update
   * @returns {Promise<void>}
   * @private
   */
  async syncEntity(ctx) {
    var _a;
    if (!ctx.chat) return;
    const chat = ctx.chat;
    const chatId = chat.id.toString();
    const worldId = createUniqueUuid2(this.runtime, chatId);
    const roomId = createUniqueUuid2(
      this.runtime,
      ((_a = ctx.message) == null ? void 0 : _a.message_thread_id) ? `${ctx.chat.id}-${ctx.message.message_thread_id}` : ctx.chat.id.toString()
    );
    await this.syncMessageSender(ctx, worldId, roomId, chatId);
    await this.syncNewChatMember(ctx, worldId, roomId, chatId);
    await this.syncLeftChatMember(ctx);
  }
  /**
   * Synchronizes the message sender entity with the runtime system.
   * This is the most common entity sync case.
   *
   * @param {Context} ctx - The context of the incoming update
   * @param {UUID} worldId - The ID of the world
   * @param {UUID} roomId - The ID of the room
   * @param {string} chatId - The ID of the chat
   * @returns {Promise<void>}
   * @private
   */
  async syncMessageSender(ctx, worldId, roomId, chatId) {
    if (ctx.from && !this.syncedEntityIds.has(ctx.from.id.toString())) {
      const telegramId = ctx.from.id.toString();
      const entityId = createUniqueUuid2(this.runtime, telegramId);
      await this.runtime.ensureConnection({
        entityId,
        roomId,
        userName: ctx.from.username,
        userId: telegramId,
        name: ctx.from.first_name || ctx.from.username || "Unknown User",
        source: "telegram",
        channelId: chatId,
        serverId: chatId,
        type: ChannelType2.GROUP,
        worldId
      });
      this.syncedEntityIds.add(entityId);
    }
  }
  /**
   * Synchronizes a new chat member entity with the runtime system.
   * Triggered when a user joins the chat.
   *
   * @param {Context} ctx - The context of the incoming update
   * @param {UUID} worldId - The ID of the world
   * @param {UUID} roomId - The ID of the room
   * @param {string} chatId - The ID of the chat
   * @returns {Promise<void>}
   * @private
   */
  async syncNewChatMember(ctx, worldId, roomId, chatId) {
    if (ctx.message && "new_chat_member" in ctx.message) {
      const newMember = ctx.message.new_chat_member;
      const telegramId = newMember.id.toString();
      const entityId = createUniqueUuid2(this.runtime, telegramId);
      if (this.syncedEntityIds.has(telegramId)) return;
      await this.runtime.ensureConnection({
        entityId,
        roomId,
        userName: newMember.username,
        userId: telegramId,
        name: newMember.first_name || newMember.username || "Unknown User",
        source: "telegram",
        channelId: chatId,
        serverId: chatId,
        type: ChannelType2.GROUP,
        worldId
      });
      this.syncedEntityIds.add(entityId);
      this.runtime.emitEvent(["TELEGRAM_ENTITY_JOINED" /* ENTITY_JOINED */], {
        runtime: this.runtime,
        entityId,
        worldId,
        newMember,
        ctx
      });
    }
  }
  /**
   * Updates entity status when a user leaves the chat.
   *
   * @param {Context} ctx - The context of the incoming update
   * @returns {Promise<void>}
   * @private
   */
  async syncLeftChatMember(ctx) {
    if (ctx.message && "left_chat_member" in ctx.message) {
      const leftMember = ctx.message.left_chat_member;
      const telegramId = leftMember.id.toString();
      const entityId = createUniqueUuid2(this.runtime, telegramId);
      const existingEntity = await this.runtime.getEntityById(entityId);
      if (existingEntity) {
        existingEntity.metadata = {
          ...existingEntity.metadata,
          status: "INACTIVE",
          leftAt: Date.now()
        };
        await this.runtime.updateEntity(existingEntity);
      }
    }
  }
  /**
   * Handles forum topics by creating appropriate rooms in the runtime system.
   * This enables proper conversation management for Telegram's forum feature.
   *
   * @param {Context} ctx - The context of the incoming update
   * @returns {Promise<void>}
   * @private
   */
  async handleForumTopic(ctx) {
    var _a;
    if (!ctx.chat || !((_a = ctx.message) == null ? void 0 : _a.message_thread_id)) return;
    const chat = ctx.chat;
    const chatId = chat.id.toString();
    const worldId = createUniqueUuid2(this.runtime, chatId);
    const room = await this.buildForumTopicRoom(ctx, worldId);
    if (!room) return;
    await this.runtime.ensureRoomExists(room);
  }
  /**
   * Builds entity for message sender
   */
  buildMsgSenderEntity(from) {
    if (!from) return null;
    const userId = createUniqueUuid2(this.runtime, from.id.toString());
    const telegramId = from.id.toString();
    return {
      id: userId,
      agentId: this.runtime.agentId,
      names: [from.first_name || from.username || "Unknown User"],
      metadata: {
        telegram: {
          id: telegramId,
          username: from.username,
          name: from.first_name || from.username || "Unknown User"
        }
      }
    };
  }
  /**
   * Handles new chat discovery and emits WORLD_JOINED event.
   * This is a critical function that ensures new chats are properly
   * registered in the runtime system and appropriate events are emitted.
   *
   * @param {Context} ctx - The context of the incoming update
   * @returns {Promise<void>}
   * @private
   */
  async handleNewChat(ctx) {
    var _a;
    if (!ctx.chat) return;
    const chat = ctx.chat;
    const chatId = chat.id.toString();
    this.knownChats.set(chatId, chat);
    const { chatTitle, channelType } = this.getChatTypeInfo(chat);
    const worldId = createUniqueUuid2(this.runtime, chatId);
    const existingWorld = await this.runtime.getWorld(worldId);
    if (existingWorld) {
      return;
    }
    const userId = ctx.from ? createUniqueUuid2(this.runtime, ctx.from.id.toString()) : null;
    let admins = [];
    let owner = null;
    if (chat.type === "group" || chat.type === "supergroup" || chat.type === "channel") {
      try {
        admins = await ctx.getChatAdministrators();
        owner = admins.find((admin) => admin.status === "creator");
      } catch (error) {
        logger2.warn(`Could not get chat administrators: ${error.message}`);
      }
    }
    let ownerId = userId;
    if (owner) {
      ownerId = createUniqueUuid2(this.runtime, String(owner.user.id));
    }
    const world = {
      id: worldId,
      name: chatTitle,
      agentId: this.runtime.agentId,
      serverId: chatId,
      metadata: {
        source: "telegram",
        ownership: { ownerId },
        roles: ownerId ? {
          [ownerId]: Role.OWNER
        } : {},
        chatType: chat.type,
        isForumEnabled: chat.type === "supergroup" && chat.is_forum
      }
    };
    await this.runtime.ensureWorldExists(world);
    const generalRoom = {
      id: createUniqueUuid2(this.runtime, chatId),
      name: chatTitle,
      source: "telegram",
      type: channelType,
      channelId: chatId,
      serverId: chatId,
      worldId
    };
    await this.runtime.ensureRoomExists(generalRoom);
    const rooms = [generalRoom];
    if (chat.type === "supergroup" && chat.is_forum && ((_a = ctx.message) == null ? void 0 : _a.message_thread_id)) {
      const topicRoom = await this.buildForumTopicRoom(ctx, worldId);
      if (topicRoom) {
        rooms.push(topicRoom);
      }
      await this.runtime.ensureRoomExists(topicRoom);
    }
    const entities = await this.buildStandardizedEntities(chat);
    if (ctx.from) {
      const senderEntity = this.buildMsgSenderEntity(ctx.from);
      if (senderEntity && !entities.some((e) => e.id === senderEntity.id)) {
        entities.push(senderEntity);
        this.syncedEntityIds.add(senderEntity.id);
      }
    }
    await this.batchProcessEntities(
      entities,
      generalRoom.id,
      generalRoom.channelId,
      generalRoom.serverId,
      generalRoom.type,
      worldId
    );
    const telegramWorldPayload = {
      runtime: this.runtime,
      world,
      rooms,
      entities,
      source: "telegram",
      chat,
      botUsername: this.bot.botInfo.username
    };
    if (chat.type !== "private") {
      await this.runtime.emitEvent("TELEGRAM_WORLD_JOINED" /* WORLD_JOINED */, telegramWorldPayload);
    }
    await this.runtime.emitEvent(EventType2.WORLD_JOINED, {
      runtime: this.runtime,
      world,
      rooms,
      entities,
      source: "telegram"
    });
  }
  /**
   * Processes entities in batches to prevent overwhelming the system.
   *
   * @param {Entity[]} entities - The entities to process
   * @param {UUID} roomId - The ID of the room to connect entities to
   * @param {string} channelId - The channel ID
   * @param {string} serverId - The server ID
   * @param {ChannelType} roomType - The type of the room
   * @param {UUID} worldId - The ID of the world
   * @returns {Promise<void>}
   * @private
   */
  async batchProcessEntities(entities, roomId, channelId, serverId, roomType, worldId) {
    const batchSize = 50;
    for (let i = 0; i < entities.length; i += batchSize) {
      const entityBatch = entities.slice(i, i + batchSize);
      await Promise.all(
        entityBatch.map(async (entity) => {
          var _a, _b, _c, _d, _e, _f, _g, _h;
          try {
            await this.runtime.ensureConnection({
              entityId: entity.id,
              roomId,
              userName: (_b = (_a = entity.metadata) == null ? void 0 : _a.telegram) == null ? void 0 : _b.username,
              name: (_d = (_c = entity.metadata) == null ? void 0 : _c.telegram) == null ? void 0 : _d.name,
              userId: (_f = (_e = entity.metadata) == null ? void 0 : _e.telegram) == null ? void 0 : _f.id,
              source: "telegram",
              channelId,
              serverId,
              type: roomType,
              worldId
            });
          } catch (err) {
            logger2.warn(`Failed to sync user ${(_h = (_g = entity.metadata) == null ? void 0 : _g.telegram) == null ? void 0 : _h.username}: ${err}`);
          }
        })
      );
      if (i + batchSize < entities.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
  /**
   * Gets chat title and channel type based on Telegram chat type.
   * Maps Telegram-specific chat types to standardized system types.
   *
   * @param {any} chat - The Telegram chat object
   * @returns {Object} Object containing chatTitle and channelType
   * @private
   */
  getChatTypeInfo(chat) {
    let chatTitle;
    let channelType;
    switch (chat.type) {
      case "private":
        chatTitle = `Chat with ${chat.first_name || "Unknown User"}`;
        channelType = ChannelType2.DM;
        break;
      case "group":
        chatTitle = chat.title || "Unknown Group";
        channelType = ChannelType2.GROUP;
        break;
      case "supergroup":
        chatTitle = chat.title || "Unknown Supergroup";
        channelType = ChannelType2.GROUP;
        break;
      case "channel":
        chatTitle = chat.title || "Unknown Channel";
        channelType = ChannelType2.FEED;
        break;
      default:
        chatTitle = "Unknown Chat";
        channelType = ChannelType2.GROUP;
    }
    return { chatTitle, channelType };
  }
  /**
   * Builds standardized entity representations from Telegram chat data.
   * Transforms Telegram-specific user data into system-standard Entity objects.
   *
   * @param {any} chat - The Telegram chat object
   * @returns {Promise<Entity[]>} Array of standardized Entity objects
   * @private
   */
  async buildStandardizedEntities(chat) {
    const entities = [];
    try {
      if (chat.type === "private" && chat.id) {
        const userId = createUniqueUuid2(this.runtime, chat.id.toString());
        entities.push({
          id: userId,
          names: [chat.first_name || "Unknown User"],
          agentId: this.runtime.agentId,
          metadata: {
            telegram: {
              id: chat.id.toString(),
              username: chat.username || "unknown",
              name: chat.first_name || "Unknown User"
            },
            source: "telegram"
          }
        });
        this.syncedEntityIds.add(userId);
      } else if (chat.type === "group" || chat.type === "supergroup") {
        try {
          const admins = await this.bot.telegram.getChatAdministrators(chat.id);
          if (admins && admins.length > 0) {
            for (const admin of admins) {
              const userId = createUniqueUuid2(this.runtime, admin.user.id.toString());
              entities.push({
                id: userId,
                names: [admin.user.first_name || admin.user.username || "Unknown Admin"],
                agentId: this.runtime.agentId,
                metadata: {
                  telegram: {
                    id: admin.user.id.toString(),
                    username: admin.user.username || "unknown",
                    name: admin.user.first_name || "Unknown Admin",
                    isAdmin: true,
                    adminTitle: admin.custom_title || (admin.status === "creator" ? "Owner" : "Admin")
                  },
                  source: "telegram",
                  roles: [admin.status === "creator" ? Role.OWNER : Role.ADMIN]
                }
              });
              this.syncedEntityIds.add(userId);
            }
          }
        } catch (error) {
          logger2.warn(`Could not fetch administrators for chat ${chat.id}: ${error}`);
        }
      }
    } catch (error) {
      logger2.error(
        `Error building standardized entities: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return entities;
  }
  /**
   * Extracts and builds the room object for a forum topic from a message context.
   * This refactored method can be used both in middleware and when handling new chats.
   *
   * @param {Context} ctx - The context of the incoming update
   * @param {UUID} worldId - The ID of the world the topic belongs to
   * @returns {Promise<Room | null>} A Promise that resolves with the room or null if not a topic
   * @private
   */
  async buildForumTopicRoom(ctx, worldId) {
    var _a;
    if (!ctx.chat || !((_a = ctx.message) == null ? void 0 : _a.message_thread_id)) return null;
    if (ctx.chat.type !== "supergroup" || !ctx.chat.is_forum) return null;
    const chat = ctx.chat;
    const chatId = chat.id.toString();
    const threadId = ctx.message.message_thread_id.toString();
    const roomId = createUniqueUuid2(this.runtime, `${chatId}-${threadId}`);
    try {
      const replyMessage = JSON.parse(JSON.stringify(ctx.message));
      let topicName = `Topic #${threadId}`;
      if (replyMessage && typeof replyMessage === "object" && "forum_topic_created" in replyMessage && replyMessage.forum_topic_created) {
        const topicCreated = replyMessage.forum_topic_created;
        if (topicCreated && typeof topicCreated === "object" && "name" in topicCreated) {
          topicName = topicCreated.name;
        }
      } else if (replyMessage && typeof replyMessage === "object" && "reply_to_message" in replyMessage && replyMessage.reply_to_message && typeof replyMessage.reply_to_message === "object" && "forum_topic_created" in replyMessage.reply_to_message && replyMessage.reply_to_message.forum_topic_created) {
        const topicCreated = replyMessage.reply_to_message.forum_topic_created;
        if (topicCreated && typeof topicCreated === "object" && "name" in topicCreated) {
          topicName = topicCreated.name;
        }
      }
      const room = {
        id: roomId,
        name: topicName,
        source: "telegram",
        type: ChannelType2.GROUP,
        channelId: `${chatId}-${threadId}`,
        serverId: chatId,
        worldId,
        metadata: {
          threadId,
          isForumTopic: true,
          parentChatId: chatId
        }
      };
      return room;
    } catch (error) {
      logger2.error(
        `Error building forum topic room: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }
};

// src/tests.ts
import { logger as logger3 } from "@elizaos/core";
var TEST_IMAGE_URL = "https://github.com/elizaOS/awesome-eliza/blob/main/assets/eliza-logo.jpg?raw=true";
var TelegramTestSuite = class {
  name = "telegram";
  telegramClient = null;
  bot = null;
  messageManager = null;
  tests;
  /**
   * Constructor for initializing a set of test cases for a Telegram bot.
   *
   * @constructor
   * @property {Array<Object>} tests - An array of test cases with name and corresponding test functions.
   * @property {string} tests.name - The name of the test case.
   * @property {function} tests.fn - The test function to be executed.
   */
  constructor() {
    this.tests = [
      {
        name: "Initialize and Validate Telegram Bot Connection",
        fn: this.testCreatingTelegramBot.bind(this)
      },
      {
        name: "Send Basic Text Message to Telegram Chat",
        fn: this.testSendingTextMessage.bind(this)
      },
      {
        name: "Send Text Message with an Image Attachment",
        fn: this.testSendingMessageWithAttachment.bind(this)
      },
      {
        name: "Handle and Process Incoming Telegram Messages",
        fn: this.testHandlingMessage.bind(this)
      },
      {
        name: "Process and Validate Image Attachments in Incoming Messages",
        fn: this.testProcessingImages.bind(this)
      }
    ];
  }
  /**
   * Retrieves the Telegram test chat ID from environment variables.
   *
   * Reference on getting the Telegram chat ID:
   * https://stackoverflow.com/a/32572159
   */
  /**
   * Validates the chat ID by checking if it is set in the runtime settings or environment variables.
   * If not set, an error is thrown with a message instructing to provide a valid chat ID.
   * @param {IAgentRuntime} runtime - The runtime object that provides access to the settings and environment variables.
   * @throws {Error} If TELEGRAM_TEST_CHAT_ID is not set in the runtime settings or environment variables.
   * @returns {string} The validated chat ID.
   */
  validateChatId(runtime) {
    const testChatId = runtime.getSetting("TELEGRAM_TEST_CHAT_ID") || process.env.TELEGRAM_TEST_CHAT_ID;
    if (!testChatId) {
      throw new Error(
        "TELEGRAM_TEST_CHAT_ID is not set. Please provide a valid chat ID in the environment variables."
      );
    }
    return testChatId;
  }
  async getChatInfo(runtime) {
    try {
      const chatId = this.validateChatId(runtime);
      const chat = await this.bot.telegram.getChat(chatId);
      logger3.log(`Fetched real chat: ${JSON.stringify(chat)}`);
      return chat;
    } catch (error) {
      throw new Error(`Error fetching real Telegram chat: ${error}`);
    }
  }
  async testCreatingTelegramBot(runtime) {
    this.telegramClient = runtime.getService("telegram");
    this.bot = this.telegramClient.messageManager.bot;
    this.messageManager = this.telegramClient.messageManager;
    logger3.debug("Telegram bot initialized successfully.");
  }
  async testSendingTextMessage(runtime) {
    try {
      if (!this.bot) throw new Error("Bot not initialized.");
      const chatId = this.validateChatId(runtime);
      await this.bot.telegram.sendMessage(chatId, "Testing Telegram message!");
      logger3.debug("Message sent successfully.");
    } catch (error) {
      throw new Error(`Error sending Telegram message: ${error}`);
    }
  }
  async testSendingMessageWithAttachment(runtime) {
    try {
      if (!this.messageManager) throw new Error("MessageManager not initialized.");
      const chat = await this.getChatInfo(runtime);
      const mockContext = {
        chat,
        from: { id: 123, username: "TestUser" },
        telegram: this.bot.telegram
      };
      const messageContent = {
        text: "Here is an image attachment:",
        attachments: [
          {
            id: "123",
            title: "Sample Image",
            source: TEST_IMAGE_URL,
            text: "Sample Image",
            url: TEST_IMAGE_URL,
            contentType: "image/png",
            description: "Sample Image"
          }
        ]
      };
      await this.messageManager.sendMessageInChunks(mockContext, messageContent);
      logger3.success("Message with image attachment sent successfully.");
    } catch (error) {
      throw new Error(`Error sending Telegram message with attachment: ${error}`);
    }
  }
  async testHandlingMessage(runtime) {
    var _a;
    try {
      const chat = await this.getChatInfo(runtime);
      const mockContext = {
        chat,
        from: {
          id: 123,
          username: "TestUser",
          is_bot: false,
          first_name: "Test",
          last_name: "User"
        },
        message: {
          message_id: void 0,
          text: `@${(_a = this.bot.botInfo) == null ? void 0 : _a.username}! Hello!`,
          date: Math.floor(Date.now() / 1e3),
          chat
        },
        telegram: this.bot.telegram
      };
      try {
        await this.messageManager.handleMessage(mockContext);
      } catch (error) {
        throw new Error(`Error handling Telegram message: ${error}`);
      }
    } catch (error) {
      throw new Error(`Error handling Telegram message: ${error}`);
    }
  }
  async testProcessingImages(runtime) {
    var _a;
    try {
      const chatId = this.validateChatId(runtime);
      const fileId = await this.getFileId(chatId, TEST_IMAGE_URL);
      const mockMessage = {
        message_id: void 0,
        chat: { id: chatId },
        date: Math.floor(Date.now() / 1e3),
        photo: [{ file_id: fileId }],
        text: `@${(_a = this.bot.botInfo) == null ? void 0 : _a.username}!`
      };
      const { description } = await this.messageManager.processImage(mockMessage);
      if (!description) {
        throw new Error("Error processing Telegram image");
      }
      logger3.log(`Processing Telegram image successfully: ${description}`);
    } catch (error) {
      throw new Error(`Error processing Telegram image: ${error}`);
    }
  }
  async getFileId(chatId, imageUrl) {
    try {
      const message = await this.bot.telegram.sendPhoto(chatId, imageUrl);
      return message.photo[message.photo.length - 1].file_id;
    } catch (error) {
      logger3.error(`Error sending image: ${error}`);
      throw error;
    }
  }
};

// src/index.ts
var telegramPlugin = {
  name: TELEGRAM_SERVICE_NAME,
  description: "Telegram client plugin",
  services: [TelegramService],
  tests: [new TelegramTestSuite()]
};
var index_default = telegramPlugin;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map