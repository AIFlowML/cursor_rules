// src/index.ts
import { logger as logger8 } from "@elizaos/core";

// src/actions/chatWithAttachments.ts
import fs from "node:fs";
import {
  ChannelType,
  ModelType,
  composePromptFromState,
  parseJSONObjectFromText,
  trimTokens
} from "@elizaos/core";
var summarizationTemplate = `# Summarized so far (we are adding to this)
{{currentSummary}}

# Current attachments we are summarizing
{{attachmentsWithText}}

Summarization objective: {{objective}}

# Instructions: Summarize the attachments. Return the summary. Do not acknowledge this request, just summarize and continue the existing summary if there is one. Capture any important details based on the objective. Only respond with the new summary text.`;
var attachmentIdsTemplate = `# Messages we are summarizing
{{recentMessages}}

# Instructions: {{senderName}} is requesting a summary of specific attachments. Your goal is to determine their objective, along with the list of attachment IDs to summarize.
The "objective" is a detailed description of what the user wants to summarize based on the conversation.
The "attachmentIds" is an array of attachment IDs that the user wants to summarize. If not specified, default to including all attachments from the conversation.

Your response must be formatted as a JSON block with this structure:
\`\`\`json
{
  "objective": "<What the user wants to summarize>",
  "attachmentIds": ["<Attachment ID 1>", "<Attachment ID 2>", ...]
}
\`\`\`
`;
var getAttachmentIds = async (runtime, _message, state) => {
  const prompt = composePromptFromState({
    state,
    template: attachmentIdsTemplate
  });
  for (let i = 0; i < 5; i++) {
    const response = await runtime.useModel(ModelType.TEXT_SMALL, {
      prompt
    });
    const parsedResponse = parseJSONObjectFromText(response);
    if (parsedResponse?.objective && parsedResponse?.attachmentIds) {
      return parsedResponse;
    }
  }
  return null;
};
var chatWithAttachments = {
  name: "CHAT_WITH_ATTACHMENTS",
  similes: [
    "CHAT_WITH_ATTACHMENT",
    "SUMMARIZE_FILES",
    "SUMMARIZE_FILE",
    "SUMMARIZE_ATACHMENT",
    "CHAT_WITH_PDF",
    "ATTACHMENT_SUMMARY",
    "RECAP_ATTACHMENTS",
    "SUMMARIZE_FILE",
    "SUMMARIZE_VIDEO",
    "SUMMARIZE_AUDIO",
    "SUMMARIZE_IMAGE",
    "SUMMARIZE_DOCUMENT",
    "SUMMARIZE_LINK",
    "ATTACHMENT_SUMMARY",
    "FILE_SUMMARY"
  ],
  description: "Answer a user request informed by specific attachments based on their IDs. If a user asks to chat with a PDF, or wants more specific information about a link or video or anything else they've attached, this is the action to use.",
  validate: async (_runtime, message, _state) => {
    const room = await _runtime.getRoom(message.roomId);
    if (room?.type !== ChannelType.GROUP) {
      return false;
    }
    const keywords = [
      "attachment",
      "summary",
      "summarize",
      "research",
      "pdf",
      "video",
      "audio",
      "image",
      "document",
      "link",
      "file",
      "attachment",
      "summarize",
      "code",
      "report",
      "write",
      "details",
      "information",
      "talk",
      "chat",
      "read",
      "listen",
      "watch"
    ];
    return keywords.some(
      (keyword) => message.content.text?.toLowerCase().includes(keyword.toLowerCase())
    );
  },
  handler: async (runtime, message, state, _options, callback) => {
    const callbackData = {
      text: "",
      // fill in later
      actions: ["CHAT_WITH_ATTACHMENTS_RESPONSE"],
      source: message.content.source,
      attachments: []
    };
    const attachmentData = await getAttachmentIds(runtime, message, state);
    if (!attachmentData) {
      console.error("Couldn't get attachment IDs from message");
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: message.content.source,
            thought: "I tried to chat with attachments but I couldn't get attachment IDs",
            actions: ["CHAT_WITH_ATTACHMENTS_FAILED"]
          },
          metadata: {
            type: "CHAT_WITH_ATTACHMENTS"
          }
        },
        "messages"
      );
      return;
    }
    const { objective, attachmentIds } = attachmentData;
    const conversationLength = runtime.getConversationLength();
    const recentMessages = await runtime.getMemories({
      tableName: "messages",
      roomId: message.roomId,
      count: conversationLength,
      unique: false
    });
    const attachments = recentMessages.filter((msg) => msg.content.attachments && msg.content.attachments.length > 0).flatMap((msg) => msg.content.attachments).filter(
      (attachment) => attachmentIds.map((attch) => attch.toLowerCase().slice(0, 5)).includes(attachment.id.toLowerCase().slice(0, 5)) || // or check the other way
      attachmentIds.some((id) => {
        const attachmentId = id.toLowerCase().slice(0, 5);
        return attachment.id.toLowerCase().includes(attachmentId);
      })
    );
    const attachmentsWithText = attachments.map((attachment) => `# ${attachment.title}
${attachment.text}`).join("\n\n");
    let currentSummary = "";
    const chunkSize = 8192;
    state.values.attachmentsWithText = attachmentsWithText;
    state.values.objective = objective;
    const template = await trimTokens(summarizationTemplate, chunkSize, runtime);
    const prompt = composePromptFromState({
      state,
      // make sure it fits, we can pad the tokens a bit
      // Get the model's tokenizer based on the current model being used
      template
    });
    const summary = await runtime.useModel(ModelType.TEXT_SMALL, {
      prompt
    });
    currentSummary = `${currentSummary}
${summary}`;
    if (!currentSummary) {
      console.error("No summary found, that's not good!");
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: message.content.source,
            thought: "I tried to chat with attachments but I couldn't get a summary",
            actions: ["CHAT_WITH_ATTACHMENTS_FAILED"]
          },
          metadata: {
            type: "CHAT_WITH_ATTACHMENTS"
          }
        },
        "messages"
      );
      return;
    }
    callbackData.text = currentSummary.trim();
    if (callbackData.text && (currentSummary.trim()?.split("\n").length < 4 || currentSummary.trim()?.split(" ").length < 100)) {
      callbackData.text = `Here is the summary:
\`\`\`md
${currentSummary.trim()}
\`\`\`
`;
      await callback(callbackData);
    } else if (currentSummary.trim()) {
      const summaryDir = "cache";
      const summaryFilename = `${summaryDir}/summary_${Date.now()}.md`;
      try {
        await fs.promises.mkdir(summaryDir, { recursive: true });
        await fs.promises.writeFile(summaryFilename, currentSummary, "utf8");
        await runtime.setCache(summaryFilename, currentSummary);
        await callback(
          {
            ...callbackData,
            text: `I've attached the summary of the requested attachments as a text file.`
          },
          [summaryFilename]
        );
      } catch (error) {
        console.error("Error in file/cache process:", error);
        throw error;
      }
    } else {
      console.warn("Empty response from chat with attachments action, skipping");
    }
    return callbackData;
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you summarize the attachments b3e23, c4f67, and d5a89?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Sure thing! I'll pull up those specific attachments and provide a summary of their content.",
          actions: ["CHAT_WITH_ATTACHMENTS"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I need a technical summary of the PDFs I sent earlier - a1b2c3.pdf, d4e5f6.pdf, and g7h8i9.pdf"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "I'll take a look at those specific PDF attachments and put together a technical summary for you. Give me a few minutes to review them.",
          actions: ["CHAT_WITH_ATTACHMENTS"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you watch this video for me and tell me which parts you think are most relevant to the report I'm writing? (the one I attached in my last message)"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "sure, no problem.",
          actions: ["CHAT_WITH_ATTACHMENTS"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "can you read my blog post and give me a detailed breakdown of the key points I made, and then suggest a handful of tweets to promote it?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "great idea, give me a minute",
          actions: ["CHAT_WITH_ATTACHMENTS"]
        }
      }
    ]
  ]
};
var chatWithAttachments_default = chatWithAttachments;

// src/actions/downloadMedia.ts
import {
  ModelType as ModelType2,
  ServiceType,
  composePromptFromState as composePromptFromState2,
  parseJSONObjectFromText as parseJSONObjectFromText2
} from "@elizaos/core";
var mediaUrlTemplate = `# Messages we are searching for a media URL
{{recentMessages}}

# Instructions: {{senderName}} is requesting to download a specific media file (video or audio). Your goal is to determine the URL of the media they want to download.
The "mediaUrl" is the URL of the media file that the user wants downloaded. If not specified, return null.

Your response must be formatted as a JSON block with this structure:
\`\`\`json
{
  "mediaUrl": "<Media URL>"
}
\`\`\`
`;
var getMediaUrl = async (runtime, _message, state) => {
  const prompt = composePromptFromState2({
    state,
    template: mediaUrlTemplate
  });
  for (let i = 0; i < 5; i++) {
    const response = await runtime.useModel(ModelType2.TEXT_SMALL, {
      prompt
    });
    const parsedResponse = parseJSONObjectFromText2(response);
    if (parsedResponse?.mediaUrl) {
      return parsedResponse.mediaUrl;
    }
  }
  return null;
};
var downloadMedia = {
  name: "DOWNLOAD_MEDIA",
  similes: [
    "DOWNLOAD_VIDEO",
    "DOWNLOAD_AUDIO",
    "GET_MEDIA",
    "DOWNLOAD_PODCAST",
    "DOWNLOAD_YOUTUBE"
  ],
  description: "Downloads a video or audio file from a URL and attaches it to the response message.",
  validate: async (_runtime, message, _state) => {
    if (message.content.source !== "discord") {
      return false;
    }
  },
  handler: async (runtime, message, state, _options, callback) => {
    const videoService = runtime.getService(ServiceType.VIDEO);
    const mediaUrl = await getMediaUrl(runtime, message, state);
    if (!mediaUrl) {
      console.error("Couldn't get media URL from messages");
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: "discord",
            thought: `I couldn't find the media URL in the message`,
            actions: ["DOWNLOAD_MEDIA_FAILED"]
          },
          metadata: {
            type: "DOWNLOAD_MEDIA"
          }
        },
        "messages"
      );
      return;
    }
    const videoInfo = await videoService.fetchVideoInfo(mediaUrl);
    const mediaPath = await videoService.downloadVideo(videoInfo);
    const response = {
      text: `I downloaded the video "${videoInfo.title}" and attached it below.`,
      actions: ["DOWNLOAD_MEDIA_RESPONSE"],
      source: message.content.source,
      attachments: []
    };
    const maxRetries = 3;
    let retries = 0;
    while (retries < maxRetries) {
      try {
        await callback(
          {
            ...response
          },
          [mediaPath]
        );
        break;
      } catch (error) {
        retries++;
        console.error(`Error sending message (attempt ${retries}):`, error);
        if (retries === maxRetries) {
          console.error("Max retries reached. Failed to send message with attachment.");
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
    }
    return response;
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Downloading the YouTube video now, one sec",
          actions: ["DOWNLOAD_MEDIA"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you grab this video for me? https://vimeo.com/123456789"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Sure thing, I'll download that Vimeo video for you",
          actions: ["DOWNLOAD_MEDIA"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I need this video downloaded: https://www.youtube.com/watch?v=abcdefg"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "No problem, I'm on it. I'll have that YouTube video downloaded in a jiffy",
          actions: ["DOWNLOAD_MEDIA"]
        }
      }
    ]
  ]
};

// src/actions/summarizeConversation.ts
import fs2 from "node:fs";
import {
  ModelType as ModelType3,
  composePromptFromState as composePromptFromState3,
  getEntityDetails,
  parseJSONObjectFromText as parseJSONObjectFromText3,
  splitChunks,
  trimTokens as trimTokens2
} from "@elizaos/core";
var summarizationTemplate2 = `# Summarized so far (we are adding to this)
{{currentSummary}}

# Current conversation chunk we are summarizing (includes attachments)
{{memoriesWithAttachments}}

Summarization objective: {{objective}}

# Instructions: Summarize the conversation so far. Return the summary. Do not acknowledge this request, just summarize and continue the existing summary if there is one. Capture any important details to the objective. Only respond with the new summary text.
Your response should be extremely detailed and include any and all relevant information.`;
var dateRangeTemplate = `# Messages we are summarizing (the conversation is continued after this)
{{recentMessages}}

# Instructions: {{senderName}} is requesting a summary of the conversation. Your goal is to determine their objective, along with the range of dates that their request covers.
The "objective" is a detailed description of what the user wants to summarize based on the conversation. If they just ask for a general summary, you can either base it off the conversation if the summary range is very recent, or set the object to be general, like "a detailed summary of the conversation between all users".
The "start" and "end" are the range of dates that the user wants to summarize, relative to the current time. The start and end should be relative to the current time, and measured in seconds, minutes, hours and days. The format is "2 days ago" or "3 hours ago" or "4 minutes ago" or "5 seconds ago", i.e. "<integer> <unit> ago".
If you aren't sure, you can use a default range of "0 minutes ago" to "2 hours ago" or more. Better to err on the side of including too much than too little.

Your response must be formatted as a JSON block with this structure:
\`\`\`json
{
  "objective": "<What the user wants to summarize>",
  "start": "0 minutes ago",
  "end": "2 hours ago"
}
\`\`\`
`;
var getDateRange = async (runtime, _message, state) => {
  const prompt = composePromptFromState3({
    state,
    template: dateRangeTemplate
  });
  for (let i = 0; i < 5; i++) {
    const response = await runtime.useModel(ModelType3.TEXT_SMALL, {
      prompt
    });
    const parsedResponse = parseJSONObjectFromText3(response);
    if (parsedResponse) {
      if (parsedResponse.objective && parsedResponse.start && parsedResponse.end) {
        const startIntegerString = parsedResponse.start.match(/\d+/)?.[0];
        const endIntegerString = parsedResponse.end.match(/\d+/)?.[0];
        const multipliers = {
          second: 1 * 1e3,
          minute: 60 * 1e3,
          hour: 3600 * 1e3,
          day: 86400 * 1e3
        };
        const startMultiplier = parsedResponse.start.match(
          /second|minute|hour|day/
        )?.[0];
        const endMultiplier = parsedResponse.end.match(/second|minute|hour|day/)?.[0];
        const startInteger = startIntegerString ? Number.parseInt(startIntegerString) : 0;
        const endInteger = endIntegerString ? Number.parseInt(endIntegerString) : 0;
        const startTime = startInteger * multipliers[startMultiplier];
        const endTime = endInteger * multipliers[endMultiplier];
        parsedResponse.start = Date.now() - startTime;
        parsedResponse.end = Date.now() - endTime;
        return parsedResponse;
      }
    }
  }
};
var summarize = {
  name: "SUMMARIZE_CONVERSATION",
  similes: [
    "RECAP",
    "RECAP_CONVERSATION",
    "SUMMARIZE_CHAT",
    "SUMMARIZATION",
    "CHAT_SUMMARY",
    "CONVERSATION_SUMMARY"
  ],
  description: "Summarizes the conversation and attachments.",
  validate: async (_runtime, message, _state) => {
    if (message.content.source !== "discord") {
      return false;
    }
    const keywords = [
      "summarize",
      "summarization",
      "summary",
      "recap",
      "report",
      "overview",
      "review",
      "rundown",
      "wrap-up",
      "brief",
      "debrief",
      "abstract",
      "synopsis",
      "outline",
      "digest",
      "abridgment",
      "condensation",
      "encapsulation",
      "essence",
      "gist",
      "main points",
      "key points",
      "key takeaways",
      "bulletpoint",
      "highlights",
      "tldr",
      "tl;dr",
      "in a nutshell",
      "bottom line",
      "long story short",
      "sum up",
      "sum it up",
      "short version",
      "bring me up to speed",
      "catch me up"
    ];
    return keywords.some(
      (keyword) => message.content.text?.toLowerCase().includes(keyword.toLowerCase())
    );
  },
  handler: async (runtime, message, state, _options, callback) => {
    const callbackData = {
      text: "",
      // fill in later
      actions: ["SUMMARIZATION_RESPONSE"],
      source: message.content.source,
      attachments: []
    };
    const { roomId } = message;
    const dateRange = await getDateRange(runtime, message, state);
    if (!dateRange) {
      console.error("Couldn't get date range from message");
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: "discord",
            thought: `I couldn't get the date range from the message`,
            actions: ["SUMMARIZE_CONVERSATION_FAILED"]
          },
          metadata: {
            type: "SUMMARIZE_CONVERSATION"
          }
        },
        "messages"
      );
      return;
    }
    const { objective, start, end } = dateRange;
    const memories = await runtime.getMemories({
      tableName: "messages",
      roomId,
      // subtract start from current time
      start: Number.parseInt(start),
      end: Number.parseInt(end),
      count: 1e4,
      unique: false
    });
    const entities = await getEntityDetails({
      runtime,
      roomId
    });
    const actorMap = new Map(entities.map((entity) => [entity.id, entity]));
    const formattedMemories = memories.map((memory) => {
      const attachments = memory.content.attachments?.map((attachment) => {
        return `---
Attachment: ${attachment.id}
${attachment.description}
${attachment.text}
---`;
      }).join("\n");
      return `${actorMap.get(memory.entityId)?.name ?? "Unknown User"} (${actorMap.get(memory.entityId)?.username ?? ""}): ${memory.content.text}
${attachments}`;
    }).join("\n");
    let currentSummary = "";
    const chunkSize = 8e3;
    const chunks = await splitChunks(formattedMemories, chunkSize, 0);
    const _datestr = (/* @__PURE__ */ new Date()).toUTCString().replace(/:/g, "-");
    state.values.memoriesWithAttachments = formattedMemories;
    state.values.objective = objective;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      state.values.currentSummary = currentSummary;
      state.values.currentChunk = chunk;
      const template = await trimTokens2(summarizationTemplate2, chunkSize + 500, runtime);
      const prompt = composePromptFromState3({
        state,
        // make sure it fits, we can pad the tokens a bit
        template
      });
      const summary = await runtime.useModel(ModelType3.TEXT_SMALL, {
        prompt
      });
      currentSummary = `${currentSummary}
${summary}`;
    }
    if (!currentSummary) {
      console.error("No summary found, that's not good!");
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: "discord",
            thought: `I couldn't summarize the conversation`,
            actions: ["SUMMARIZE_CONVERSATION_FAILED"]
          },
          metadata: {
            type: "SUMMARIZE_CONVERSATION"
          }
        },
        "messages"
      );
      return;
    }
    callbackData.text = currentSummary.trim();
    if (callbackData.text && (currentSummary.trim()?.split("\n").length < 4 || currentSummary.trim()?.split(" ").length < 100)) {
      callbackData.text = `Here is the summary:
\`\`\`md
${currentSummary.trim()}
\`\`\`
`;
      await callback(callbackData);
    } else if (currentSummary.trim()) {
      const summaryDir = "cache";
      const summaryFilename = `${summaryDir}/conversation_summary_${Date.now()}`;
      await runtime.setCache(summaryFilename, currentSummary);
      await fs2.promises.mkdir(summaryDir, { recursive: true });
      await fs2.promises.writeFile(summaryFilename, currentSummary, "utf8");
      await callback(
        {
          ...callbackData,
          text: `I've attached the summary of the conversation from \`${new Date(Number.parseInt(start)).toString()}\` to \`${new Date(Number.parseInt(end)).toString()}\` as a text file.`
        },
        [summaryFilename]
      );
    } else {
      console.warn("Empty response from summarize conversation action, skipping");
    }
    return callbackData;
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "```js\nconst x = 10\n```"
        }
      },
      {
        name: "{{name1}}",
        content: {
          text: "can you give me a detailed report on what we're talking about?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "sure, no problem, give me a minute to get that together for you",
          actions: ["SUMMARIZE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "please summarize the conversation we just had and include this blogpost i'm linking (Attachment: b3e12)"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "sure, give me a sec",
          actions: ["SUMMARIZE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you summarize what moon and avf are talking about?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Yeah, just hold on a second while I get that together for you...",
          actions: ["SUMMARIZE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "i need to write a blog post about farming, can you summarize the discussion from a few hours ago?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "no problem, give me a few minutes to read through everything",
          actions: ["SUMMARIZE"]
        }
      }
    ]
  ]
};

// src/actions/transcribeMedia.ts
import {
  ModelType as ModelType4,
  composePromptFromState as composePromptFromState4,
  parseJSONObjectFromText as parseJSONObjectFromText4
} from "@elizaos/core";
var mediaAttachmentIdTemplate = `# Messages we are transcribing
{{recentMessages}}

# Instructions: {{senderName}} is requesting a transcription of a specific media file (audio or video). Your goal is to determine the ID of the attachment they want transcribed.
The "attachmentId" is the ID of the media file attachment that the user wants transcribed. If not specified, return null.

Your response must be formatted as a JSON block with this structure:
\`\`\`json
{
  "attachmentId": "<Attachment ID>"
}
\`\`\`
`;
var getMediaAttachmentId = async (runtime, _message, state) => {
  const prompt = composePromptFromState4({
    state,
    template: mediaAttachmentIdTemplate
  });
  for (let i = 0; i < 5; i++) {
    const response = await runtime.useModel(ModelType4.TEXT_SMALL, {
      prompt
    });
    const parsedResponse = parseJSONObjectFromText4(response);
    if (parsedResponse?.attachmentId) {
      return parsedResponse.attachmentId;
    }
  }
  return null;
};
var transcribeMedia = {
  name: "TRANSCRIBE_MEDIA",
  similes: [
    "TRANSCRIBE_AUDIO",
    "TRANSCRIBE_VIDEO",
    "MEDIA_TRANSCRIPT",
    "VIDEO_TRANSCRIPT",
    "AUDIO_TRANSCRIPT"
  ],
  description: "Transcribe the full text of an audio or video file that the user has attached.",
  validate: async (_runtime, message, _state) => {
    if (message.content.source !== "discord") {
      return false;
    }
    const keywords = [
      "transcribe",
      "transcript",
      "audio",
      "video",
      "media",
      "youtube",
      "meeting",
      "recording",
      "podcast",
      "call",
      "conference",
      "interview",
      "speech",
      "lecture",
      "presentation"
    ];
    return keywords.some(
      (keyword) => message.content.text?.toLowerCase().includes(keyword.toLowerCase())
    );
  },
  handler: async (runtime, message, state, _options, callback) => {
    const callbackData = {
      text: "",
      // fill in later
      actions: ["TRANSCRIBE_MEDIA_RESPONSE"],
      source: message.content.source,
      attachments: []
    };
    const attachmentId = await getMediaAttachmentId(runtime, message, state);
    if (!attachmentId) {
      console.error("Couldn't get media attachment ID from message");
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: "discord",
            thought: `I couldn't find the media attachment ID in the message`,
            actions: ["TRANSCRIBE_MEDIA_FAILED"]
          },
          metadata: {
            type: "TRANSCRIBE_MEDIA"
          }
        },
        "messages"
      );
      return;
    }
    const conversationLength = runtime.getConversationLength();
    const recentMessages = await runtime.getMemories({
      tableName: "messages",
      roomId: message.roomId,
      count: conversationLength,
      unique: false
    });
    const attachment = recentMessages.filter((msg) => msg.content.attachments && msg.content.attachments.length > 0).flatMap((msg) => msg.content.attachments).find((attachment2) => attachment2.id.toLowerCase() === attachmentId.toLowerCase());
    if (!attachment) {
      console.error(`Couldn't find attachment with ID ${attachmentId}`);
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: "discord",
            thought: `I couldn't find the media attachment with ID ${attachmentId}`,
            actions: ["TRANSCRIBE_MEDIA_FAILED"]
          },
          metadata: {
            type: "TRANSCRIBE_MEDIA"
          }
        },
        "messages"
      );
      return;
    }
    const mediaTranscript = attachment.text;
    callbackData.text = mediaTranscript.trim();
    if (callbackData.text && (callbackData.text?.split("\n").length < 4 || callbackData.text?.split(" ").length < 100)) {
      callbackData.text = `Here is the transcript:
\`\`\`md
${mediaTranscript.trim()}
\`\`\`
`;
      await callback(callbackData);
    } else if (callbackData.text) {
      const transcriptFilename = `content/transcript_${Date.now()}`;
      await runtime.setCache(transcriptFilename, callbackData.text);
      await callback(
        {
          ...callbackData,
          text: `I've attached the transcript as a text file.`
        },
        [transcriptFilename]
      );
    } else {
      console.warn("Empty response from transcribe media action, skipping");
    }
    return callbackData;
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Please transcribe the audio file I just sent."
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Sure, I'll transcribe the full audio for you.",
          actions: ["TRANSCRIBE_MEDIA"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can I get a transcript of that video recording?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Absolutely, give me a moment to generate the full transcript of the video.",
          actions: ["TRANSCRIBE_MEDIA"]
        }
      }
    ]
  ]
};

// src/actions/voiceJoin.ts
import {
  ChannelType as ChannelType2,
  ModelType as ModelType5,
  composePromptFromState as composePromptFromState5,
  createUniqueUuid as createUniqueUuid2,
  logger
} from "@elizaos/core";
import {
  ChannelType as DiscordChannelType
} from "discord.js";

// src/types.ts
var ServiceType2 = {
  DISCORD: "discord"
};

// src/actions/voiceJoin.ts
var joinVoice = {
  name: "JOIN_VOICE",
  similes: [
    "JOIN_VOICE",
    "JOIN_VC",
    "JOIN_VOICE_CHAT",
    "JOIN_VOICE_CHANNEL",
    "JOIN_MEETING",
    "JOIN_CALL"
  ],
  validate: async (runtime, message, state) => {
    if (message.content.source !== "discord") {
      return false;
    }
    const room = state.data.room ?? await runtime.getRoom(message.roomId);
    if (room?.type !== ChannelType2.GROUP && room?.type !== ChannelType2.VOICE_GROUP) {
      return false;
    }
    const client = runtime.getService(ServiceType2.DISCORD);
    if (!client) {
      logger.error("Discord client not found");
      return false;
    }
    return true;
  },
  description: "Join a voice channel to participate in voice chat.",
  handler: async (runtime, message, state, _options, callback) => {
    const room = state.data.room ?? await runtime.getRoom(message.roomId);
    if (!room) {
      throw new Error("No room found");
    }
    if (room?.type !== ChannelType2.GROUP && room?.type !== ChannelType2.VOICE_GROUP) {
      return false;
    }
    const serverId = room.serverId;
    if (!serverId) {
      throw new Error("No server ID found");
    }
    const discordClient = runtime.getService(ServiceType2.DISCORD);
    const client = discordClient.client;
    const voiceManager = discordClient.voiceManager;
    if (!client) {
      logger.error("Discord client not found");
      return false;
    }
    const voiceChannels = client.guilds.cache.get(serverId).channels.cache.filter(
      (channel) => channel.type === DiscordChannelType.GuildVoice
    );
    const targetChannel = voiceChannels.find((channel) => {
      const name = channel.name.toLowerCase();
      const messageContent = message?.content?.text;
      const replacedName = name.replace(/[^a-z0-9 ]/g, "");
      return name.includes(messageContent) || messageContent.includes(name) || replacedName.includes(messageContent) || messageContent.includes(replacedName);
    });
    if (targetChannel) {
      voiceManager.joinChannel(targetChannel);
      return true;
    }
    const guild = client.guilds.cache.get(serverId);
    const members = guild?.members.cache;
    const member = members?.find(
      (member2) => createUniqueUuid2(runtime, member2.id) === message.entityId
    );
    if (member?.voice?.channel) {
      voiceManager.joinChannel(member?.voice?.channel);
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: "discord",
            thought: `I joined the voice channel ${member?.voice?.channel?.name}`,
            actions: ["JOIN_VOICE_STARTED"]
          },
          metadata: {
            type: "JOIN_VOICE"
          }
        },
        "messages"
      );
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: createUniqueUuid2(runtime, targetChannel.id),
          content: {
            source: "discord",
            thought: `I joined the voice channel ${targetChannel.name}`,
            actions: ["JOIN_VOICE_STARTED"]
          },
          metadata: {
            type: "JOIN_VOICE"
          }
        },
        "messages"
      );
      return true;
    }
    const messageTemplate = `
The user has requested to join a voice channel.
Here is the list of channels available in the server:
{{voiceChannels}}

Here is the user's request:
{{userMessage}}

Please respond with the name of the voice channel which the bot should join. Try to infer what channel the user is talking about. If the user didn't specify a voice channel, respond with "none".
You should only respond with the name of the voice channel or none, no commentary or additional information should be included.
`;
    const guessState = {
      userMessage: message.content.text,
      voiceChannels: voiceChannels.map((channel) => channel.name).join("\n")
    };
    const prompt = composePromptFromState5({
      template: messageTemplate,
      state: guessState
    });
    const responseContent = await runtime.useModel(ModelType5.TEXT_SMALL, {
      prompt
    });
    if (responseContent && responseContent.trim().length > 0) {
      const channelName = responseContent.toLowerCase();
      const targetChannel2 = voiceChannels.find((channel) => {
        const name = channel.name.toLowerCase();
        const replacedName = name.replace(/[^a-z0-9 ]/g, "");
        return name.includes(channelName) || channelName.includes(name) || replacedName.includes(channelName) || channelName.includes(replacedName);
      });
      if (targetChannel2) {
        voiceManager.joinChannel(targetChannel2);
        await runtime.createMemory(
          {
            entityId: message.entityId,
            agentId: message.agentId,
            roomId: message.roomId,
            content: {
              source: "discord",
              thought: `I joined the voice channel ${member?.voice?.channel?.name}`,
              actions: ["JOIN_VOICE_STARTED"]
            },
            metadata: {
              type: "JOIN_VOICE"
            }
          },
          "messages"
        );
        await runtime.createMemory(
          {
            entityId: message.entityId,
            agentId: message.agentId,
            roomId: createUniqueUuid2(runtime, targetChannel2.id),
            content: {
              source: "discord",
              thought: `I joined the voice channel ${targetChannel2.name}`,
              actions: ["JOIN_VOICE_STARTED"]
            },
            metadata: {
              type: "JOIN_VOICE"
            }
          },
          "messages"
        );
        return true;
      }
    }
    await callback({
      text: "I couldn't figure out which channel you wanted me to join.",
      source: "discord"
    });
    return false;
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Hey, let's jump into the 'General' voice and chat"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Sounds good",
          actions: ["JOIN_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "{{name2}}, can you join the vc, I want to discuss our strat"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Sure I'll join right now",
          actions: ["JOIN_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "hey {{name2}}, we're having a team meeting in the 'conference' voice channel, plz join us"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "OK see you there",
          actions: ["JOIN_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "{{name2}}, let's have a quick voice chat in the 'Lounge' channel."
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "kk be there in a sec",
          actions: ["JOIN_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Hey {{name2}}, can you join me in the 'Music' voice channel"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Sure",
          actions: ["JOIN_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "join voice chat with us {{name2}}"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "coming",
          actions: ["JOIN_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "hop in vc {{name2}}"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "joining now",
          actions: ["JOIN_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "get in vc with us {{name2}}"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "im in",
          actions: ["JOIN_VOICE"]
        }
      }
    ]
  ]
};

// src/actions/voiceLeave.ts
import {
  ChannelType as ChannelType3,
  createUniqueUuid as createUniqueUuid3,
  logger as logger2
} from "@elizaos/core";
import { BaseGuildVoiceChannel } from "discord.js";
var leaveVoice = {
  name: "LEAVE_VOICE",
  similes: [
    "LEAVE_VOICE",
    "LEAVE_VC",
    "LEAVE_VOICE_CHAT",
    "LEAVE_VOICE_CHANNEL",
    "LEAVE_MEETING",
    "LEAVE_CALL"
  ],
  validate: async (runtime, message, state) => {
    if (message.content.source !== "discord") {
      return false;
    }
    const service = runtime.getService(ServiceType2.DISCORD);
    if (!service) {
      logger2.error("Discord client not found");
      return false;
    }
    const room = state.data.room ?? await runtime.getRoom(message.roomId);
    if (room?.type !== ChannelType3.GROUP && room?.type !== ChannelType3.VOICE_GROUP) {
      return false;
    }
    const isConnectedToVoice = service.client.voice.adapters.size > 0;
    return isConnectedToVoice;
  },
  description: "Leave the current voice channel.",
  handler: async (runtime, message, _state, _options) => {
    const room = await runtime.getRoom(message.roomId);
    if (!room) {
      throw new Error("No room found");
    }
    if (room?.type !== ChannelType3.GROUP && room?.type !== ChannelType3.VOICE_GROUP) {
      throw new Error("Not a group");
    }
    const serverId = room.serverId;
    if (!serverId) {
      throw new Error("No server ID found 9");
    }
    const discordClient = runtime.getService(ServiceType2.DISCORD);
    const voiceManager = discordClient.voiceManager;
    const client = discordClient.client;
    if (!client) {
      logger2.error("Discord client not found");
      throw new Error("Discord client not found");
    }
    if (!voiceManager) {
      logger2.error("voiceManager is not available.");
      throw new Error("voiceManager is not available.");
    }
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      console.warn("Bot is not in any voice channel.");
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: "discord",
            thought: "I tried to leave the voice channel but I'm not in any voice channel.",
            actions: ["LEAVE_VOICE"]
          },
          metadata: {
            type: "LEAVE_VOICE"
          }
        },
        "messages"
      );
      return false;
    }
    const voiceChannel = guild.members.me?.voice.channel;
    if (!voiceChannel || !(voiceChannel instanceof BaseGuildVoiceChannel)) {
      console.warn("Could not retrieve the voice channel.");
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: "discord",
            thought: "I tried to leave the voice channel but I couldn't find it.",
            actions: ["LEAVE_VOICE"]
          },
          metadata: {
            type: "LEAVE_VOICE"
          }
        },
        "messages"
      );
      return false;
    }
    const connection = voiceManager.getVoiceConnection(guild.id);
    if (!connection) {
      console.warn("No active voice connection found for the bot.");
      await runtime.createMemory(
        {
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: "discord",
            thought: "I tried to leave the voice channel but I couldn't find the connection.",
            actions: ["LEAVE_VOICE"]
          },
          metadata: {
            type: "LEAVE_VOICE"
          }
        },
        "messages"
      );
      return false;
    }
    voiceManager.leaveChannel(voiceChannel);
    await runtime.createMemory(
      {
        entityId: message.entityId,
        agentId: message.agentId,
        roomId: createUniqueUuid3(runtime, voiceChannel.id),
        content: {
          source: "discord",
          thought: `I left the voice channel ${voiceChannel.name}`,
          actions: ["LEAVE_VOICE_STARTED"]
        },
        metadata: {
          type: "LEAVE_VOICE"
        }
      },
      "messages"
    );
    return true;
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Hey {{name2}} please leave the voice channel"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Sure",
          actions: ["LEAVE_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I have to go now but thanks for the chat"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "You too, talk to you later",
          actions: ["LEAVE_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Great call everyone, hopping off now",
          actions: ["LEAVE_VOICE"]
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Agreed, I'll hop off too",
          actions: ["LEAVE_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Hey {{name2}} I need you to step away from the voice chat for a bit"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "No worries, I'll leave the voice channel",
          actions: ["LEAVE_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "{{name2}}, I think we covered everything, you can leave the voice chat now"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Sounds good, see you both later",
          actions: ["LEAVE_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "leave voice {{name2}}"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "ok leaving",
          actions: ["LEAVE_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "plz leave the voice chat {{name2}}"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "aight im out",
          actions: ["LEAVE_VOICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "yo {{name2}} gtfo the vc"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "sorry, talk to you later",
          actions: ["LEAVE_VOICE"]
        }
      }
    ]
  ]
};

// src/providers/channelState.ts
import { ChannelType as ChannelType4 } from "@elizaos/core";
var channelStateProvider = {
  name: "channelState",
  get: async (runtime, message, state) => {
    const room = state.data?.room ?? await runtime.getRoom(message.roomId);
    if (!room) {
      throw new Error("No room found");
    }
    if (message.content.source !== "discord") {
      return {
        data: null,
        values: {},
        text: ""
      };
    }
    const agentName = state?.agentName || "The agent";
    const senderName = state?.senderName || "someone";
    let responseText = "";
    let channelType = "";
    let serverName = "";
    let channelId = "";
    const serverId = room.serverId;
    if (room.type === ChannelType4.DM) {
      channelType = "DM";
      responseText = `${agentName} is currently in a direct message conversation with ${senderName}. ${agentName} should engage in conversation, should respond to messages that are addressed to them and only ignore messages that seem to not require a response.`;
    } else {
      channelType = "GROUP";
      if (!serverId) {
        console.error("No server ID found");
        return {
          data: {
            room,
            channelType
          },
          values: {
            channelType
          },
          text: ""
        };
      }
      channelId = room.channelId;
      const discordService = runtime.getService(ServiceType2.DISCORD);
      if (!discordService) {
        console.warn("No discord client found");
        return {
          data: {
            room,
            channelType,
            serverId
          },
          values: {
            channelType,
            serverId
          },
          text: ""
        };
      }
      const guild = discordService.client.guilds.cache.get(serverId);
      serverName = guild.name;
      responseText = `${agentName} is currently having a conversation in the channel \`@${channelId} in the server \`${serverName}\` (@${serverId})`;
      responseText += `
${agentName} is in a room with other users and should be self-conscious and only participate when directly addressed or when the conversation is relevant to them.`;
    }
    return {
      data: {
        room,
        channelType,
        serverId,
        serverName,
        channelId
      },
      values: {
        channelType,
        serverName,
        channelId
      },
      text: responseText
    };
  }
};

// src/providers/voiceState.ts
import { getVoiceConnection } from "@discordjs/voice";
import { ChannelType as ChannelType5 } from "@elizaos/core";
var voiceStateProvider = {
  name: "voiceState",
  get: async (runtime, message, state) => {
    const room = await runtime.getRoom(message.roomId);
    if (!room) {
      throw new Error("No room found");
    }
    if (room.type !== ChannelType5.GROUP) {
      return {
        data: {
          isInVoiceChannel: false,
          room
        },
        values: {
          isInVoiceChannel: "false",
          roomType: room.type
        },
        text: ""
      };
    }
    const serverId = room.serverId;
    if (!serverId) {
      throw new Error("No server ID found 10");
    }
    const connection = getVoiceConnection(serverId);
    const agentName = state?.agentName || "The agent";
    if (!connection) {
      return {
        data: {
          isInVoiceChannel: false,
          room,
          serverId
        },
        values: {
          isInVoiceChannel: "false",
          serverId
        },
        text: `${agentName} is not currently in a voice channel`
      };
    }
    const worldId = room.worldId;
    const world = await runtime.getWorld(worldId);
    if (!world) {
      throw new Error("No world found");
    }
    const worldName = world.name;
    const roomType = room.type;
    const channelId = room.channelId;
    const channelName = room.name;
    if (!channelId) {
      return {
        data: {
          isInVoiceChannel: true,
          room,
          serverId,
          world,
          connection
        },
        values: {
          isInVoiceChannel: "true",
          serverId,
          worldName,
          roomType
        },
        text: `${agentName} is in an invalid voice channel`
      };
    }
    return {
      data: {
        isInVoiceChannel: true,
        room,
        serverId,
        world,
        connection,
        channelId,
        channelName
      },
      values: {
        isInVoiceChannel: "true",
        serverId,
        worldName,
        roomType,
        channelId,
        channelName
      },
      text: `${agentName} is currently in the voice channel: ${channelName} (ID: ${channelId})`
    };
  }
};

// src/service.ts
import {
  ChannelType as ChannelType9,
  EventType as EventType2,
  Role,
  Service,
  createUniqueUuid as createUniqueUuid6,
  logger as logger6
} from "@elizaos/core";
import {
  ChannelType as DiscordChannelType4,
  Client as DiscordJsClient,
  Events,
  GatewayIntentBits,
  Partials,
  PermissionsBitField as PermissionsBitField2
} from "discord.js";

// src/constants.ts
var MESSAGE_CONSTANTS = {
  MAX_MESSAGES: 10,
  RECENT_MESSAGE_COUNT: 3,
  CHAT_HISTORY_COUNT: 5,
  INTEREST_DECAY_TIME: 5 * 60 * 1e3,
  // 5 minutes
  PARTIAL_INTEREST_DECAY: 3 * 60 * 1e3,
  // 3 minutes
  DEFAULT_SIMILARITY_THRESHOLD: 0.3,
  DEFAULT_SIMILARITY_THRESHOLD_FOLLOW_UPS: 0.2
};
var DISCORD_SERVICE_NAME = "discord";

// src/messages.ts
import {
  ChannelType as ChannelType7,
  EventType,
  ServiceType as ServiceType4,
  createUniqueUuid as createUniqueUuid4,
  logger as logger4
} from "@elizaos/core";
import {
  ChannelType as DiscordChannelType2
} from "discord.js";

// src/attachments.ts
import fs3 from "node:fs";
import { trimTokens as trimTokens3 } from "@elizaos/core";
import { parseJSONObjectFromText as parseJSONObjectFromText5 } from "@elizaos/core";
import {
  ModelType as ModelType6,
  ServiceType as ServiceType3
} from "@elizaos/core";
import { Collection } from "discord.js";
import ffmpeg from "fluent-ffmpeg";
async function generateSummary(runtime, text) {
  text = await trimTokens3(text, 1e5, runtime);
  const prompt = `Please generate a concise summary for the following text:

  Text: """
  ${text}
  """

  Respond with a JSON object in the following format:
  \`\`\`json
  {
    "title": "Generated Title",
    "summary": "Generated summary and/or description of the text"
  }
  \`\`\``;
  const response = await runtime.useModel(ModelType6.TEXT_SMALL, {
    prompt
  });
  const parsedResponse = parseJSONObjectFromText5(response);
  if (parsedResponse?.title && parsedResponse?.summary) {
    return {
      title: parsedResponse.title,
      description: parsedResponse.summary
    };
  }
  return {
    title: "",
    description: ""
  };
}
var AttachmentManager = class {
  attachmentCache = /* @__PURE__ */ new Map();
  runtime;
  /**
   * Constructor for creating a new instance of the class.
   *
   * @param {IAgentRuntime} runtime The runtime object to be injected into the instance.
   */
  constructor(runtime) {
    this.runtime = runtime;
  }
  /**
   * Processes attachments and returns an array of Media objects.
   * @param {Collection<string, Attachment> | Attachment[]} attachments - The attachments to be processed
   * @returns {Promise<Media[]>} - An array of processed Media objects
   */
  async processAttachments(attachments) {
    const processedAttachments = [];
    const attachmentCollection = attachments instanceof Collection ? attachments : new Collection(attachments.map((att) => [att.id, att]));
    for (const [, attachment] of attachmentCollection) {
      const media = await this.processAttachment(attachment);
      if (media) {
        processedAttachments.push(media);
      }
    }
    return processedAttachments;
  }
  /**
   * Processes the provided attachment to generate a media object.
   * If the media for the attachment URL is already cached, it will return the cached media.
   * Otherwise, it will determine the type of attachment (PDF, text, audio, video, image, generic)
   * and call the corresponding processing method to generate the media object.
   *
   * @param attachment The attachment to process
   * @returns A promise that resolves to a Media object representing the attachment, or null if the attachment could not be processed
   */
  async processAttachment(attachment) {
    if (this.attachmentCache.has(attachment.url)) {
      return this.attachmentCache.get(attachment.url);
    }
    let media = null;
    if (attachment.contentType?.startsWith("application/pdf")) {
      media = await this.processPdfAttachment(attachment);
    } else if (attachment.contentType?.startsWith("text/plain")) {
      media = await this.processPlaintextAttachment(attachment);
    } else if (attachment.contentType?.startsWith("audio/") || attachment.contentType?.startsWith("video/mp4")) {
      media = await this.processAudioVideoAttachment(attachment);
    } else if (attachment.contentType?.startsWith("image/")) {
      media = await this.processImageAttachment(attachment);
    } else if (attachment.contentType?.startsWith("video/") || this.runtime.getService(ServiceType3.VIDEO).isVideoUrl(attachment.url)) {
      media = await this.processVideoAttachment(attachment);
    } else {
      media = await this.processGenericAttachment(attachment);
    }
    if (media) {
      this.attachmentCache.set(attachment.url, media);
    }
    return media;
  }
  /**
   * Asynchronously processes an audio or video attachment provided as input and returns a Media object.
   * @param {Attachment} attachment - The attachment object containing information about the audio/video file.
   * @returns {Promise<Media>} A Promise that resolves to a Media object representing the processed audio/video attachment.
   */
  async processAudioVideoAttachment(attachment) {
    try {
      const response = await fetch(attachment.url);
      const audioVideoArrayBuffer = await response.arrayBuffer();
      let audioBuffer;
      if (attachment.contentType?.startsWith("audio/")) {
        audioBuffer = Buffer.from(audioVideoArrayBuffer);
      } else if (attachment.contentType?.startsWith("video/mp4")) {
        audioBuffer = await this.extractAudioFromMP4(audioVideoArrayBuffer);
      } else {
        throw new Error("Unsupported audio/video format");
      }
      const transcription = await this.runtime.useModel(ModelType6.TRANSCRIPTION, audioBuffer);
      const { title, description } = await generateSummary(this.runtime, transcription);
      return {
        id: attachment.id,
        url: attachment.url,
        title: title || "Audio/Video Attachment",
        source: attachment.contentType?.startsWith("audio/") ? "Audio" : "Video",
        description: description || "User-uploaded audio/video attachment which has been transcribed",
        text: transcription || "Audio/video content not available"
      };
    } catch (error) {
      console.error(`Error processing audio/video attachment: ${error.message}`);
      return {
        id: attachment.id,
        url: attachment.url,
        title: "Audio/Video Attachment",
        source: attachment.contentType?.startsWith("audio/") ? "Audio" : "Video",
        description: "An audio/video attachment (transcription failed)",
        text: `This is an audio/video attachment. File name: ${attachment.name}, Size: ${attachment.size} bytes, Content type: ${attachment.contentType}`
      };
    }
  }
  /**
   * Extracts the audio stream from the provided MP4 data and converts it to MP3 format.
   *
   * @param {ArrayBuffer} mp4Data - The MP4 data to extract audio from
   * @returns {Promise<Buffer>} - A Promise that resolves with the converted audio data as a Buffer
   */
  async extractAudioFromMP4(mp4Data) {
    const tempMP4File = `temp_${Date.now()}.mp4`;
    const tempAudioFile = `temp_${Date.now()}.mp3`;
    try {
      fs3.writeFileSync(tempMP4File, Buffer.from(mp4Data));
      await new Promise((resolve, reject) => {
        ffmpeg(tempMP4File).outputOptions("-vn").audioCodec("libmp3lame").save(tempAudioFile).on("end", () => {
          resolve();
        }).on("error", (err) => {
          reject(err);
        }).run();
      });
      const audioData = fs3.readFileSync(tempAudioFile);
      return audioData;
    } finally {
      if (fs3.existsSync(tempMP4File)) {
        fs3.unlinkSync(tempMP4File);
      }
      if (fs3.existsSync(tempAudioFile)) {
        fs3.unlinkSync(tempAudioFile);
      }
    }
  }
  /**
   * Processes a PDF attachment by fetching the PDF file from the specified URL,
   * converting it to text, generating a summary, and returning a Media object
   * with the extracted information.
   * If an error occurs during processing, a placeholder Media object is returned
   * with an error message.
   *
   * @param {Attachment} attachment - The PDF attachment to process.
   * @returns {Promise<Media>} A promise that resolves to a Media object representing
   * the processed PDF attachment.
   */
  async processPdfAttachment(attachment) {
    try {
      const response = await fetch(attachment.url);
      const pdfBuffer = await response.arrayBuffer();
      const text = await this.runtime.getService(ServiceType3.PDF).convertPdfToText(Buffer.from(pdfBuffer));
      const { title, description } = await generateSummary(this.runtime, text);
      return {
        id: attachment.id,
        url: attachment.url,
        title: title || "PDF Attachment",
        source: "PDF",
        description: description || "A PDF document",
        text
      };
    } catch (error) {
      console.error(`Error processing PDF attachment: ${error.message}`);
      return {
        id: attachment.id,
        url: attachment.url,
        title: "PDF Attachment (conversion failed)",
        source: "PDF",
        description: "A PDF document that could not be converted to text",
        text: `This is a PDF attachment. File name: ${attachment.name}, Size: ${attachment.size} bytes`
      };
    }
  }
  /**
   * Processes a plaintext attachment by fetching its content, generating a summary, and returning a Media object.
   * @param {Attachment} attachment - The attachment object to process.
   * @returns {Promise<Media>} A promise that resolves to a Media object representing the processed plaintext attachment.
   */
  async processPlaintextAttachment(attachment) {
    try {
      const response = await fetch(attachment.url);
      const text = await response.text();
      const { title, description } = await generateSummary(this.runtime, text);
      return {
        id: attachment.id,
        url: attachment.url,
        title: title || "Plaintext Attachment",
        source: "Plaintext",
        description: description || "A plaintext document",
        text
      };
    } catch (error) {
      console.error(`Error processing plaintext attachment: ${error.message}`);
      return {
        id: attachment.id,
        url: attachment.url,
        title: "Plaintext Attachment (retrieval failed)",
        source: "Plaintext",
        description: "A plaintext document that could not be retrieved",
        text: `This is a plaintext attachment. File name: ${attachment.name}, Size: ${attachment.size} bytes`
      };
    }
  }
  /**
   * Process the image attachment by fetching description and title using the IMAGE_DESCRIPTION model.
   * If successful, returns a Media object populated with the details. If unsuccessful, creates a fallback
   * Media object and logs the error.
   *
   * @param {Attachment} attachment - The attachment object containing the image details.
   * @returns {Promise<Media>} A promise that resolves to a Media object.
   */
  async processImageAttachment(attachment) {
    try {
      const { description, title } = await this.runtime.useModel(
        ModelType6.IMAGE_DESCRIPTION,
        attachment.url
      );
      return {
        id: attachment.id,
        url: attachment.url,
        title: title || "Image Attachment",
        source: "Image",
        description: description || "An image attachment",
        text: description || "Image content not available"
      };
    } catch (error) {
      console.error(`Error processing image attachment: ${error.message}`);
      return this.createFallbackImageMedia(attachment);
    }
  }
  /**
   * Creates a fallback Media object for image attachments that could not be recognized.
   *
   * @param {Attachment} attachment - The attachment object containing image details.
   * @returns {Media} - The fallback Media object with basic information about the image attachment.
   */
  createFallbackImageMedia(attachment) {
    return {
      id: attachment.id,
      url: attachment.url,
      title: "Image Attachment",
      source: "Image",
      description: "An image attachment (recognition failed)",
      text: `This is an image attachment. File name: ${attachment.name}, Size: ${attachment.size} bytes, Content type: ${attachment.contentType}`
    };
  }
  /**
   * Process a video attachment to extract video information.
   * @param {Attachment} attachment - The attachment object containing video information.
   * @returns {Promise<Media>} A promise that resolves to a Media object with video details.
   * @throws {Error} If video service is not available.
   */
  async processVideoAttachment(attachment) {
    const videoService = this.runtime.getService(ServiceType3.VIDEO);
    if (!videoService) {
      throw new Error("Video service not found");
    }
    if (videoService.isVideoUrl(attachment.url)) {
      const videoInfo = await videoService.processVideo(attachment.url, this.runtime);
      return {
        id: attachment.id,
        url: attachment.url,
        title: videoInfo.title,
        source: "YouTube",
        description: videoInfo.description,
        text: videoInfo.text
      };
    }
    return {
      id: attachment.id,
      url: attachment.url,
      title: "Video Attachment",
      source: "Video",
      description: "A video attachment",
      text: "Video content not available"
    };
  }
  /**
   * Process a generic attachment and return a Media object with specified properties.
   * @param {Attachment} attachment - The attachment object to process.
   * @returns {Promise<Media>} A Promise that resolves to a Media object with specified properties.
   */
  async processGenericAttachment(attachment) {
    return {
      id: attachment.id,
      url: attachment.url,
      title: "Generic Attachment",
      source: "Generic",
      description: "A generic attachment",
      text: "Attachment content not available"
    };
  }
};

// src/utils.ts
import {
  ModelType as ModelType7,
  logger as logger3,
  parseJSONObjectFromText as parseJSONObjectFromText6,
  trimTokens as trimTokens4
} from "@elizaos/core";
import {
  ChannelType as ChannelType6,
  PermissionsBitField,
  ThreadChannel
} from "discord.js";
var MAX_MESSAGE_LENGTH = 1900;
async function sendMessageInChunks(channel, content, _inReplyTo, files) {
  const sentMessages = [];
  const messages = splitMessage(content);
  try {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (message.trim().length > 0 || i === messages.length - 1 && files && files.length > 0) {
        const options = {
          content: message.trim()
        };
        if (i === messages.length - 1 && files && files.length > 0) {
          options.files = files;
        }
        const m = await channel.send(options);
        sentMessages.push(m);
      }
    }
  } catch (error) {
    logger3.error("Error sending message:", error);
  }
  return sentMessages;
}
function splitMessage(content) {
  const messages = [];
  let currentMessage = "";
  const rawLines = content?.split("\n") || [];
  const lines = rawLines.flatMap((line) => {
    const chunks = [];
    while (line.length > MAX_MESSAGE_LENGTH) {
      chunks.push(line.slice(0, MAX_MESSAGE_LENGTH));
      line = line.slice(MAX_MESSAGE_LENGTH);
    }
    chunks.push(line);
    return chunks;
  });
  for (const line of lines) {
    if (currentMessage.length + line.length + 1 > MAX_MESSAGE_LENGTH) {
      messages.push(currentMessage.trim());
      currentMessage = "";
    }
    currentMessage += `${line}
`;
  }
  if (currentMessage.trim().length > 0) {
    messages.push(currentMessage.trim());
  }
  return messages;
}
function canSendMessage(channel) {
  if (!channel) {
    return {
      canSend: false,
      reason: "No channel given"
    };
  }
  if (channel.type === ChannelType6.DM) {
    return {
      canSend: true,
      reason: null
    };
  }
  const botMember = channel.guild?.members.cache.get(channel.client.user.id);
  if (!botMember) {
    return {
      canSend: false,
      reason: "Not a guild channel or bot member not found"
    };
  }
  const requiredPermissions = [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.ReadMessageHistory
  ];
  if (channel instanceof ThreadChannel) {
    requiredPermissions.push(PermissionsBitField.Flags.SendMessagesInThreads);
  }
  const permissions = channel.permissionsFor(botMember);
  if (!permissions) {
    return {
      canSend: false,
      reason: "Could not retrieve permissions"
    };
  }
  const missingPermissions = requiredPermissions.filter((perm) => !permissions.has(perm));
  return {
    canSend: missingPermissions.length === 0,
    missingPermissions,
    reason: missingPermissions.length > 0 ? `Missing permissions: ${missingPermissions.map((p) => String(p)).join(", ")}` : null
  };
}

// src/messages.ts
var MessageManager = class {
  client;
  runtime;
  attachmentManager;
  getChannelType;
  /**
   * Constructor for a new instance of MyClass.
   * @param {any} discordClient - The Discord client object.
   */
  constructor(discordClient) {
    this.client = discordClient.client;
    this.runtime = discordClient.runtime;
    this.attachmentManager = new AttachmentManager(this.runtime);
    this.getChannelType = discordClient.getChannelType;
  }
  /**
   * Handles incoming Discord messages and processes them accordingly.
   *
   * @param {DiscordMessage} message - The Discord message to be handled
   */
  async handleMessage(message) {
    if (this.runtime.character.settings?.discord?.allowedChannelIds && !this.runtime.character.settings.discord.allowedChannelIds.some(
      (id) => id === message.channel.id
    )) {
      return;
    }
    if (message.interaction || message.author.id === this.client.user?.id) {
      return;
    }
    if (this.runtime.character.settings?.discord?.shouldIgnoreBotMessages && message.author?.bot) {
      return;
    }
    if (this.runtime.character.settings?.discord?.shouldIgnoreDirectMessages && message.channel.type === DiscordChannelType2.DM) {
      return;
    }
    if (this.runtime.character.settings?.discord?.shouldRespondOnlyToMentions && !message.mentions.users?.has(this.client.user?.id)) {
      return;
    }
    const entityId = createUniqueUuid4(this.runtime, message.author.id);
    const userName = message.author.bot ? `${message.author.username}#${message.author.discriminator}` : message.author.username;
    const name = message.author.displayName;
    const channelId = message.channel.id;
    const roomId = createUniqueUuid4(this.runtime, channelId);
    let type;
    let serverId;
    if (message.guild) {
      const guild = await message.guild.fetch();
      type = await this.getChannelType(message.channel);
      serverId = guild.id;
    } else {
      type = ChannelType7.DM;
      serverId = void 0;
    }
    await this.runtime.ensureConnection({
      entityId,
      roomId,
      userName,
      name,
      source: "discord",
      channelId: message.channel.id,
      serverId,
      type
    });
    try {
      const canSendResult = canSendMessage(message.channel);
      if (!canSendResult.canSend) {
        return logger4.warn(`Cannot send message to channel ${message.channel}`, canSendResult);
      }
      const { processedContent, attachments } = await this.processMessage(message);
      const audioAttachments = message.attachments.filter(
        (attachment) => attachment.contentType?.startsWith("audio/")
      );
      if (audioAttachments.size > 0) {
        const processedAudioAttachments = await this.attachmentManager.processAttachments(audioAttachments);
        attachments.push(...processedAudioAttachments);
      }
      if (!processedContent && !attachments?.length) {
        return;
      }
      const entityId2 = createUniqueUuid4(this.runtime, message.author.id);
      const messageId = createUniqueUuid4(this.runtime, message.id);
      const newMessage = {
        id: messageId,
        entityId: entityId2,
        agentId: this.runtime.agentId,
        roomId,
        content: {
          // name: name,
          // userName: userName,
          text: processedContent || " ",
          attachments,
          source: "discord",
          url: message.url,
          inReplyTo: message.reference?.messageId ? createUniqueUuid4(this.runtime, message.reference?.messageId) : void 0
        },
        createdAt: message.createdTimestamp
      };
      const callback = async (content, files) => {
        try {
          if (message.id && !content.inReplyTo) {
            content.inReplyTo = createUniqueUuid4(this.runtime, message.id);
          }
          const messages = await sendMessageInChunks(
            message.channel,
            content.text,
            message.id,
            files
          );
          const memories = [];
          for (const m of messages) {
            const actions = content.actions;
            const memory = {
              id: createUniqueUuid4(this.runtime, m.id),
              entityId: this.runtime.agentId,
              agentId: this.runtime.agentId,
              content: {
                ...content,
                actions,
                inReplyTo: messageId,
                url: m.url,
                channelType: type
              },
              roomId,
              createdAt: m.createdTimestamp
            };
            memories.push(memory);
          }
          for (const m of memories) {
            await this.runtime.createMemory(m, "messages");
          }
          return memories;
        } catch (error) {
          console.error("Error sending message:", error);
          return [];
        }
      };
      this.runtime.emitEvent(["DISCORD_MESSAGE_RECEIVED" /* MESSAGE_RECEIVED */, EventType.MESSAGE_RECEIVED], {
        runtime: this.runtime,
        message: newMessage,
        callback
      });
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }
  /**
   * Processes the message content, mentions, code blocks, attachments, and URLs to generate
   * processed content and media attachments.
   *
   * @param {DiscordMessage} message The message to process
   * @returns {Promise<{ processedContent: string; attachments: Media[] }>} Processed content and media attachments
   */
  async processMessage(message) {
    let processedContent = message.content;
    let attachments = [];
    const mentionRegex = /<@!?(\d+)>/g;
    processedContent = processedContent.replace(mentionRegex, (match2, entityId) => {
      const user = message.mentions.users.get(entityId);
      if (user) {
        return `${user.username} (@${entityId})`;
      }
      return match2;
    });
    const codeBlockRegex = /```([\s\S]*?)```/g;
    let match;
    while (match = codeBlockRegex.exec(processedContent)) {
      const codeBlock = match[1];
      const lines = codeBlock.split("\n");
      const title = lines[0];
      const description = lines.slice(0, 3).join("\n");
      const attachmentId = `code-${Date.now()}-${Math.floor(Math.random() * 1e3)}`.slice(-5);
      attachments.push({
        id: attachmentId,
        url: "",
        title: title || "Code Block",
        source: "Code",
        description,
        text: codeBlock
      });
      processedContent = processedContent.replace(match[0], `Code Block (${attachmentId})`);
    }
    if (message.attachments.size > 0) {
      attachments = await this.attachmentManager.processAttachments(message.attachments);
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = processedContent.match(urlRegex) || [];
    for (const url of urls) {
      if (this.runtime.getService(ServiceType4.VIDEO)?.isVideoUrl(url)) {
        const videoService = this.runtime.getService(ServiceType4.VIDEO);
        if (!videoService) {
          throw new Error("Video service not found");
        }
        const videoInfo = await videoService.processVideo(url, this.runtime);
        attachments.push({
          id: `youtube-${Date.now()}`,
          url,
          title: videoInfo.title,
          source: "YouTube",
          description: videoInfo.description,
          text: videoInfo.text
        });
      } else {
        const browserService = this.runtime.getService(ServiceType4.BROWSER);
        if (!browserService) {
          throw new Error("Browser service not found");
        }
        const { title, description: summary } = await browserService.getPageContent(
          url,
          this.runtime
        );
        attachments.push({
          id: `webpage-${Date.now()}`,
          url,
          title: title || "Web Page",
          source: "Web",
          description: summary,
          text: summary
        });
      }
    }
    return { processedContent, attachments };
  }
  /**
   * Asynchronously fetches the bot's username and discriminator from Discord API.
   *
   * @param {string} botToken The token of the bot to authenticate the request
   * @returns {Promise<string>} A promise that resolves with the bot's username and discriminator
   * @throws {Error} If there is an error while fetching the bot details
   */
  async fetchBotName(botToken) {
    const url = "https://discord.com/api/v10/users/@me";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bot ${botToken}`
      }
    });
    if (!response.ok) {
      throw new Error(`Error fetching bot details: ${response.statusText}`);
    }
    const data = await response.json();
    const discriminator = data.discriminator;
    return data.username + (discriminator ? `#${discriminator}` : "");
  }
};

// src/voice.ts
import { EventEmitter } from "node:events";
import { pipeline } from "node:stream";
import {
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnections,
  joinVoiceChannel
} from "@discordjs/voice";
import {
  ChannelType as ChannelType8,
  ModelType as ModelType8,
  createUniqueUuid as createUniqueUuid5,
  getWavHeader,
  logger as logger5
} from "@elizaos/core";
import {
  ChannelType as DiscordChannelType3
} from "discord.js";
import prism from "prism-media";
var DECODE_FRAME_SIZE = 1024;
var DECODE_SAMPLE_RATE = 16e3;
var AudioMonitor = class {
  readable;
  buffers = [];
  maxSize;
  lastFlagged = -1;
  ended = false;
  /**
   * Constructs an AudioMonitor instance.
   * @param {Readable} readable - The readable stream to monitor for audio data.
   * @param {number} maxSize - The maximum size of the audio buffer.
   * @param {function} onStart - The callback function to be called when audio starts.
   * @param {function} callback - The callback function to process audio data.
   */
  constructor(readable, maxSize, onStart, callback) {
    this.readable = readable;
    this.maxSize = maxSize;
    this.readable.on("data", (chunk) => {
      if (this.lastFlagged < 0) {
        this.lastFlagged = this.buffers.length;
      }
      this.buffers.push(chunk);
      const currentSize = this.buffers.reduce((acc, cur) => acc + cur.length, 0);
      while (currentSize > this.maxSize) {
        this.buffers.shift();
        this.lastFlagged--;
      }
    });
    this.readable.on("end", () => {
      logger5.log("AudioMonitor ended");
      this.ended = true;
      if (this.lastFlagged < 0) return;
      callback(this.getBufferFromStart());
      this.lastFlagged = -1;
    });
    this.readable.on("speakingStopped", () => {
      if (this.ended) return;
      logger5.log("Speaking stopped");
      if (this.lastFlagged < 0) return;
      callback(this.getBufferFromStart());
    });
    this.readable.on("speakingStarted", () => {
      if (this.ended) return;
      onStart();
      logger5.log("Speaking started");
      this.reset();
    });
  }
  /**
   * Stops listening to "data", "end", "speakingStopped", and "speakingStarted" events on the readable stream.
   */
  stop() {
    this.readable.removeAllListeners("data");
    this.readable.removeAllListeners("end");
    this.readable.removeAllListeners("speakingStopped");
    this.readable.removeAllListeners("speakingStarted");
  }
  /**
   * Check if the item is flagged.
   * @returns {boolean} True if the item was flagged, false otherwise.
   */
  isFlagged() {
    return this.lastFlagged >= 0;
  }
  /**
   * Returns a Buffer containing all buffers starting from the last flagged index.
   * If the last flagged index is less than 0, returns null.
   *
   * @returns {Buffer | null} The concatenated Buffer or null
   */
  getBufferFromFlag() {
    if (this.lastFlagged < 0) {
      return null;
    }
    const buffer = Buffer.concat(this.buffers.slice(this.lastFlagged));
    return buffer;
  }
  /**
   * Concatenates all buffers in the array and returns a single buffer.
   *
   * @returns {Buffer} The concatenated buffer from the start.
   */
  getBufferFromStart() {
    const buffer = Buffer.concat(this.buffers);
    return buffer;
  }
  /**
   * Resets the buffers array and sets lastFlagged to -1.
   */
  reset() {
    this.buffers = [];
    this.lastFlagged = -1;
  }
  /**
   * Check if the object has ended.
   * @returns {boolean} Returns true if the object has ended; false otherwise.
   */
  isEnded() {
    return this.ended;
  }
};
var VoiceManager = class extends EventEmitter {
  processingVoice = false;
  transcriptionTimeout = null;
  userStates = /* @__PURE__ */ new Map();
  activeAudioPlayer = null;
  client;
  runtime;
  streams = /* @__PURE__ */ new Map();
  connections = /* @__PURE__ */ new Map();
  activeMonitors = /* @__PURE__ */ new Map();
  ready;
  /**
   * Constructor for initializing a new instance of the class.
   *
   * @param {DiscordService} service - The Discord service to use.
   * @param {IAgentRuntime} runtime - The runtime for the agent.
   */
  constructor(service, runtime) {
    super();
    this.client = service.client;
    this.runtime = runtime;
    this.client.on("voiceManagerReady", () => {
      this.setReady(true);
    });
  }
  /**
   * Asynchronously retrieves the type of the channel.
   * @param {Channel} channel - The channel to get the type for.
   * @returns {Promise<ChannelType>} The type of the channel.
   */
  async getChannelType(channel) {
    switch (channel.type) {
      case DiscordChannelType3.GuildVoice:
      case DiscordChannelType3.GuildStageVoice:
        return ChannelType8.VOICE_GROUP;
    }
  }
  /**
   * Set the ready status of the VoiceManager.
   * @param {boolean} status - The status to set.
   */
  setReady(status) {
    this.ready = status;
    this.emit("ready");
    logger5.debug(`VoiceManager is now ready: ${this.ready}`);
  }
  /**
   * Check if the object is ready.
   *
   * @returns {boolean} True if the object is ready, false otherwise.
   */
  isReady() {
    return this.ready;
  }
  /**
   * Handle voice state update event.
   * @param {VoiceState} oldState - The old voice state of the member.
   * @param {VoiceState} newState - The new voice state of the member.
   * @returns {void}
   */
  async handleVoiceStateUpdate(oldState, newState) {
    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;
    const member = newState.member;
    if (!member) return;
    if (member.id === this.client.user?.id) {
      return;
    }
    if (oldChannelId === newChannelId) {
      return;
    }
    if (oldChannelId && this.connections.has(oldChannelId)) {
      this.stopMonitoringMember(member.id);
    }
    if (newChannelId && this.connections.has(newChannelId)) {
      await this.monitorMember(member, newState.channel);
    }
  }
  /**
   * Joins a voice channel and sets up the necessary connection and event listeners.
   * @param {BaseGuildVoiceChannel} channel - The voice channel to join
   */
  async joinChannel(channel) {
    const oldConnection = this.getVoiceConnection(channel.guildId);
    if (oldConnection) {
      try {
        oldConnection.destroy();
        this.streams.clear();
        this.activeMonitors.clear();
      } catch (error) {
        console.error("Error leaving voice channel:", error);
      }
    }
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
      group: this.client.user.id
    });
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Ready, 2e4),
        entersState(connection, VoiceConnectionStatus.Signalling, 2e4)
      ]);
      logger5.log(`Voice connection established in state: ${connection.state.status}`);
      connection.on("stateChange", async (oldState, newState) => {
        logger5.log(`Voice connection state changed from ${oldState.status} to ${newState.status}`);
        if (newState.status === VoiceConnectionStatus.Disconnected) {
          logger5.log("Handling disconnection...");
          try {
            await Promise.race([
              entersState(connection, VoiceConnectionStatus.Signalling, 5e3),
              entersState(connection, VoiceConnectionStatus.Connecting, 5e3)
            ]);
            logger5.log("Reconnecting to channel...");
          } catch (e) {
            logger5.log(`Disconnection confirmed - cleaning up...${e}`);
            connection.destroy();
            this.connections.delete(channel.id);
          }
        } else if (newState.status === VoiceConnectionStatus.Destroyed) {
          this.connections.delete(channel.id);
        } else if (!this.connections.has(channel.id) && (newState.status === VoiceConnectionStatus.Ready || newState.status === VoiceConnectionStatus.Signalling)) {
          this.connections.set(channel.id, connection);
        }
      });
      connection.on("error", (error) => {
        logger5.log("Voice connection error:", error);
        logger5.log("Connection error - will attempt to recover...");
      });
      this.connections.set(channel.id, connection);
      const me = channel.guild.members.me;
      if (me?.voice && me.permissions.has("DeafenMembers")) {
        try {
          await me.voice.setDeaf(false);
          await me.voice.setMute(false);
        } catch (error) {
          logger5.log("Failed to modify voice state:", error);
        }
      }
      connection.receiver.speaking.on("start", async (entityId) => {
        let user = channel.members.get(entityId);
        if (!user) {
          try {
            user = await channel.guild.members.fetch(entityId);
          } catch (error) {
            console.error("Failed to fetch user:", error);
          }
        }
        if (user && !user?.user.bot) {
          this.monitorMember(user, channel);
          this.streams.get(entityId)?.emit("speakingStarted");
        }
      });
      connection.receiver.speaking.on("end", async (entityId) => {
        const user = channel.members.get(entityId);
        if (!user?.user.bot) {
          this.streams.get(entityId)?.emit("speakingStopped");
        }
      });
    } catch (error) {
      logger5.log("Failed to establish voice connection:", error);
      connection.destroy();
      this.connections.delete(channel.id);
      throw error;
    }
  }
  /**
   * Retrieves the voice connection for a given guild ID.
   * @param {string} guildId - The ID of the guild to get the voice connection for.
   * @returns {VoiceConnection | undefined} The voice connection for the specified guild ID, or undefined if not found.
   */
  getVoiceConnection(guildId) {
    const connections = getVoiceConnections(this.client.user.id);
    if (!connections) {
      return;
    }
    const connection = [...connections.values()].find(
      (connection2) => connection2.joinConfig.guildId === guildId
    );
    return connection;
  }
  /**
   * Monitor a member's audio stream for volume activity and speaking thresholds.
   *
   * @param {GuildMember} member - The member whose audio stream is being monitored.
   * @param {BaseGuildVoiceChannel} channel - The voice channel in which the member is connected.
   */
  async monitorMember(member, channel) {
    const entityId = member?.id;
    const userName = member?.user?.username;
    const name = member?.user?.displayName;
    const connection = this.getVoiceConnection(member?.guild?.id);
    const receiveStream = connection?.receiver.subscribe(entityId, {
      autoDestroy: true,
      emitClose: true
    });
    if (!receiveStream || receiveStream.readableLength === 0) {
      return;
    }
    const opusDecoder = new prism.opus.Decoder({
      channels: 1,
      rate: DECODE_SAMPLE_RATE,
      frameSize: DECODE_FRAME_SIZE
    });
    const volumeBuffer = [];
    const VOLUME_WINDOW_SIZE = 30;
    const SPEAKING_THRESHOLD = 0.05;
    opusDecoder.on("data", (pcmData) => {
      if (this.activeAudioPlayer) {
        const samples = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.length / 2);
        const maxAmplitude = Math.max(...samples.map(Math.abs)) / 32768;
        volumeBuffer.push(maxAmplitude);
        if (volumeBuffer.length > VOLUME_WINDOW_SIZE) {
          volumeBuffer.shift();
        }
        const avgVolume = volumeBuffer.reduce((sum, v) => sum + v, 0) / VOLUME_WINDOW_SIZE;
        if (avgVolume > SPEAKING_THRESHOLD) {
          volumeBuffer.length = 0;
          this.cleanupAudioPlayer(this.activeAudioPlayer);
          this.processingVoice = false;
        }
      }
    });
    pipeline(receiveStream, opusDecoder, (err) => {
      if (err) {
        logger5.debug(`Opus decoding pipeline error: ${err}`);
      }
    });
    this.streams.set(entityId, opusDecoder);
    this.connections.set(entityId, connection);
    opusDecoder.on("error", (err) => {
      logger5.debug(`Opus decoding error: ${err}`);
    });
    const errorHandler = (err) => {
      logger5.debug(`Opus decoding error: ${err}`);
    };
    const streamCloseHandler = () => {
      logger5.debug(`voice stream from ${member?.displayName} closed`);
      this.streams.delete(entityId);
      this.connections.delete(entityId);
    };
    const closeHandler = () => {
      logger5.debug(`Opus decoder for ${member?.displayName} closed`);
      opusDecoder.removeListener("error", errorHandler);
      opusDecoder.removeListener("close", closeHandler);
      receiveStream?.removeListener("close", streamCloseHandler);
    };
    opusDecoder.on("error", errorHandler);
    opusDecoder.on("close", closeHandler);
    receiveStream?.on("close", streamCloseHandler);
    this.client.emit("userStream", entityId, name, userName, channel, opusDecoder);
  }
  /**
   * Leaves the specified voice channel and stops monitoring all members in that channel.
   * If there is an active connection in the channel, it will be destroyed.
   *
   * @param {BaseGuildVoiceChannel} channel - The voice channel to leave.
   */
  leaveChannel(channel) {
    const connection = this.connections.get(channel.id);
    if (connection) {
      connection.destroy();
      this.connections.delete(channel.id);
    }
    for (const [memberId, monitorInfo] of this.activeMonitors) {
      if (monitorInfo.channel.id === channel.id && memberId !== this.client.user?.id) {
        this.stopMonitoringMember(memberId);
      }
    }
    logger5.debug(`Left voice channel: ${channel.name} (${channel.id})`);
  }
  /**
   * Stop monitoring a specific member by their member ID.
   * @param {string} memberId - The ID of the member to stop monitoring.
   */
  stopMonitoringMember(memberId) {
    const monitorInfo = this.activeMonitors.get(memberId);
    if (monitorInfo) {
      monitorInfo.monitor.stop();
      this.activeMonitors.delete(memberId);
      this.streams.delete(memberId);
      logger5.debug(`Stopped monitoring user ${memberId}`);
    }
  }
  /**
   * Asynchronously debounces the process transcription function to prevent rapid execution.
   *
   * @param {UUID} entityId - The ID of the entity related to the transcription.
   * @param {string} name - The name of the entity for transcription.
   * @param {string} userName - The username of the user initiating the transcription.
   * @param {BaseGuildVoiceChannel} channel - The voice channel where the transcription is happening.
   */
  async debouncedProcessTranscription(entityId, name, userName, channel) {
    const DEBOUNCE_TRANSCRIPTION_THRESHOLD = 1500;
    if (this.activeAudioPlayer?.state?.status === "idle") {
      logger5.log("Cleaning up idle audio player.");
      this.cleanupAudioPlayer(this.activeAudioPlayer);
    }
    if (this.activeAudioPlayer || this.processingVoice) {
      const state = this.userStates.get(entityId);
      state.buffers.length = 0;
      state.totalLength = 0;
      return;
    }
    if (this.transcriptionTimeout) {
      clearTimeout(this.transcriptionTimeout);
    }
    this.transcriptionTimeout = setTimeout(async () => {
      this.processingVoice = true;
      try {
        await this.processTranscription(entityId, channel.id, channel, name, userName);
        this.userStates.forEach((state, _) => {
          state.buffers.length = 0;
          state.totalLength = 0;
        });
      } finally {
        this.processingVoice = false;
      }
    }, DEBOUNCE_TRANSCRIPTION_THRESHOLD);
  }
  /**
   * Handle user audio stream for monitoring purposes.
   *
   * @param {UUID} userId - The unique identifier of the user.
   * @param {string} name - The name of the user.
   * @param {string} userName - The username of the user.
   * @param {BaseGuildVoiceChannel} channel - The voice channel the user is in.
   * @param {Readable} audioStream - The audio stream to monitor.
   */
  async handleUserStream(entityId, name, userName, channel, audioStream) {
    logger5.debug(`Starting audio monitor for user: ${entityId}`);
    if (!this.userStates.has(entityId)) {
      this.userStates.set(entityId, {
        buffers: [],
        totalLength: 0,
        lastActive: Date.now(),
        transcriptionText: ""
      });
    }
    const state = this.userStates.get(entityId);
    const processBuffer = async (buffer) => {
      try {
        state?.buffers.push(buffer);
        state.totalLength += buffer.length;
        state.lastActive = Date.now();
        this.debouncedProcessTranscription(entityId, name, userName, channel);
      } catch (error) {
        console.error(`Error processing buffer for user ${entityId}:`, error);
      }
    };
    new AudioMonitor(
      audioStream,
      1e7,
      () => {
        if (this.transcriptionTimeout) {
          clearTimeout(this.transcriptionTimeout);
        }
      },
      async (buffer) => {
        if (!buffer) {
          console.error("Received empty buffer");
          return;
        }
        await processBuffer(buffer);
      }
    );
  }
  /**
   * Process the transcription of audio data for a user.
   *
   * @param {UUID} entityId - The unique ID of the user entity.
   * @param {string} channelId - The ID of the channel where the transcription is taking place.
   * @param {BaseGuildVoiceChannel} channel - The voice channel where the user is speaking.
   * @param {string} name - The name of the user.
   * @param {string} userName - The username of the user.
   * @returns {Promise<void>}
   */
  async processTranscription(entityId, channelId, channel, name, userName) {
    const state = this.userStates.get(entityId);
    if (!state || state.buffers.length === 0) return;
    try {
      let isValidTranscription = function(text) {
        if (!text || text.includes("[BLANK_AUDIO]")) return false;
        return true;
      };
      const inputBuffer = Buffer.concat(state.buffers, state.totalLength);
      state.buffers.length = 0;
      state.totalLength = 0;
      const wavBuffer = await this.convertOpusToWav(inputBuffer);
      logger5.debug("Starting transcription...");
      const transcriptionText = await this.runtime.useModel(ModelType8.TRANSCRIPTION, wavBuffer);
      if (transcriptionText && isValidTranscription(transcriptionText)) {
        state.transcriptionText += transcriptionText;
      }
      if (state.transcriptionText.length) {
        this.cleanupAudioPlayer(this.activeAudioPlayer);
        const finalText = state.transcriptionText;
        state.transcriptionText = "";
        await this.handleMessage(finalText, entityId, channelId, channel, name, userName);
      }
    } catch (error) {
      console.error(`Error transcribing audio for user ${entityId}:`, error);
    }
  }
  /**
   * Handles a voice message received in a Discord channel.
   *
   * @param {string} message - The message content.
   * @param {UUID} entityId - The entity ID associated with the message.
   * @param {string} channelId - The ID of the Discord channel where the message was received.
   * @param {BaseGuildVoiceChannel} channel - The Discord channel where the message was received.
   * @param {string} name - The name associated with the message.
   * @param {string} userName - The user name associated with the message.
   * @returns {Promise<{text: string, actions: string[]}>} Object containing the resulting text and actions.
   */
  async handleMessage(message, entityId, channelId, channel, name, userName) {
    try {
      if (!message || message.trim() === "" || message.length < 3) {
        return { text: "", actions: ["IGNORE"] };
      }
      const roomId = createUniqueUuid5(this.runtime, channelId);
      const uniqueEntityId = createUniqueUuid5(this.runtime, entityId);
      const type = await this.getChannelType(channel);
      await this.runtime.ensureConnection({
        entityId: uniqueEntityId,
        roomId,
        userName,
        name,
        source: "discord",
        channelId,
        serverId: channel.guild.id,
        type
      });
      const memory = {
        id: createUniqueUuid5(this.runtime, `${channelId}-voice-message-${Date.now()}`),
        agentId: this.runtime.agentId,
        entityId: uniqueEntityId,
        roomId,
        content: {
          text: message,
          source: "discord",
          url: channel.url,
          name,
          userName,
          isVoiceMessage: true,
          channelType: type
        },
        createdAt: Date.now()
      };
      const callback = async (content, _files = []) => {
        try {
          const responseMemory = {
            id: createUniqueUuid5(this.runtime, `${memory.id}-voice-response-${Date.now()}`),
            entityId: this.runtime.agentId,
            agentId: this.runtime.agentId,
            content: {
              ...content,
              name: this.runtime.character.name,
              inReplyTo: memory.id,
              isVoiceMessage: true,
              channelType: type
            },
            roomId,
            createdAt: Date.now()
          };
          if (responseMemory.content.text?.trim()) {
            await this.runtime.createMemory(responseMemory, "messages");
            const responseStream = await this.runtime.useModel(
              ModelType8.TEXT_TO_SPEECH,
              content.text
            );
            if (responseStream) {
              await this.playAudioStream(entityId, responseStream);
            }
          }
          return [responseMemory];
        } catch (error) {
          console.error("Error in voice message callback:", error);
          return [];
        }
      };
      this.runtime.emitEvent(["DISCORD_VOICE_MESSAGE_RECEIVED", "VOICE_MESSAGE_RECEIVED"], {
        runtime: this.runtime,
        message: memory,
        callback
      });
    } catch (error) {
      console.error("Error processing voice message:", error);
    }
  }
  /**
   * Asynchronously converts an Opus audio Buffer to a WAV audio Buffer.
   *
   * @param {Buffer} pcmBuffer - The Opus audio Buffer to convert to WAV.
   * @returns {Promise<Buffer>} A Promise that resolves with the converted WAV audio Buffer.
   */
  async convertOpusToWav(pcmBuffer) {
    try {
      const wavHeader = getWavHeader(pcmBuffer.length, DECODE_SAMPLE_RATE);
      const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
      return wavBuffer;
    } catch (error) {
      console.error("Error converting PCM to WAV:", error);
      throw error;
    }
  }
  /**
   * Scans the given Discord guild to select a suitable voice channel to join.
   *
   * @param {Guild} guild The Discord guild to scan for voice channels.
   */
  async scanGuild(guild) {
    let chosenChannel = null;
    try {
      const channelId = this.runtime.getSetting("DISCORD_VOICE_CHANNEL_ID");
      if (channelId) {
        const channel = await guild.channels.fetch(channelId);
        if (channel?.isVoiceBased()) {
          chosenChannel = channel;
        }
      }
      if (!chosenChannel) {
        const channels = (await guild.channels.fetch()).filter(
          (channel) => channel?.type === DiscordChannelType3.GuildVoice
        );
        for (const [, channel] of channels) {
          const voiceChannel = channel;
          if (voiceChannel.members.size > 0 && (chosenChannel === null || voiceChannel.members.size > chosenChannel.members.size)) {
            chosenChannel = voiceChannel;
          }
        }
      }
      if (chosenChannel) {
        logger5.debug(`Joining channel: ${chosenChannel.name}`);
        await this.joinChannel(chosenChannel);
      } else {
        logger5.debug("Warning: No suitable voice channel found to join.");
      }
    } catch (error) {
      console.error("Error selecting or joining a voice channel:", error);
    }
  }
  /**
   * Play an audio stream for a given entity ID.
   *
   * @param {UUID} entityId - The ID of the entity to play the audio for.
   * @param {Readable} audioStream - The audio stream to play.
   * @returns {void}
   */
  async playAudioStream(entityId, audioStream) {
    const connection = this.connections.get(entityId);
    if (connection == null) {
      logger5.debug(`No connection for user ${entityId}`);
      return;
    }
    this.cleanupAudioPlayer(this.activeAudioPlayer);
    const audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause
      }
    });
    this.activeAudioPlayer = audioPlayer;
    connection.subscribe(audioPlayer);
    const audioStartTime = Date.now();
    const resource = createAudioResource(audioStream, {
      inputType: StreamType.Arbitrary
    });
    audioPlayer.play(resource);
    audioPlayer.on("error", (err) => {
      logger5.debug(`Audio player error: ${err}`);
    });
    audioPlayer.on("stateChange", (_oldState, newState) => {
      if (newState.status === "idle") {
        const idleTime = Date.now();
        logger5.debug(`Audio playback took: ${idleTime - audioStartTime}ms`);
      }
    });
  }
  /**
   * Cleans up the provided audio player by stopping it, removing all listeners,
   * and resetting the active audio player if it matches the provided player.
   *
   * @param {AudioPlayer} audioPlayer - The audio player to be cleaned up.
   */
  cleanupAudioPlayer(audioPlayer) {
    if (!audioPlayer) return;
    audioPlayer.stop();
    audioPlayer.removeAllListeners();
    if (audioPlayer === this.activeAudioPlayer) {
      this.activeAudioPlayer = null;
    }
  }
  /**
   * Asynchronously handles the join channel command in an interaction.
   *
   * @param {any} interaction - The interaction object representing the user's input.
   * @returns {Promise<void>} - A promise that resolves once the join channel command is handled.
   */
  async handleJoinChannelCommand(interaction) {
    try {
      await interaction.deferReply();
      const channelId = interaction.options.get("channel")?.value;
      if (!channelId) {
        await interaction.editReply("Please provide a voice channel to join.");
        return;
      }
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply("Could not find guild.");
        return;
      }
      const voiceChannel = interaction.guild.channels.cache.find(
        (channel) => channel.id === channelId && channel.type === DiscordChannelType3.GuildVoice
      );
      if (!voiceChannel) {
        await interaction.editReply("Voice channel not found!");
        return;
      }
      await this.joinChannel(voiceChannel);
      await interaction.editReply(`Joined voice channel: ${voiceChannel.name}`);
    } catch (error) {
      console.error("Error joining voice channel:", error);
      await interaction.editReply("Failed to join the voice channel.").catch(console.error);
    }
  }
  /**
   * Handles the leave channel command by destroying the voice connection if it exists.
   *
   * @param {any} interaction The interaction object representing the command invocation.
   * @returns {void}
   */
  async handleLeaveChannelCommand(interaction) {
    const connection = this.getVoiceConnection(interaction.guildId);
    if (!connection) {
      await interaction.reply("Not currently in a voice channel.");
      return;
    }
    try {
      connection.destroy();
      await interaction.reply("Left the voice channel.");
    } catch (error) {
      console.error("Error leaving voice channel:", error);
      await interaction.reply("Failed to leave the voice channel.");
    }
  }
};

// src/service.ts
var DiscordService = class _DiscordService extends Service {
  static serviceType = DISCORD_SERVICE_NAME;
  capabilityDescription = "The agent is able to send and receive messages on discord";
  client;
  character;
  messageManager;
  voiceManager;
  /**
   * Constructor for Discord client.
   * Initializes the Discord client with specified intents and partials,
   * sets up event listeners, and ensures all servers exist.
   *
   * @param {IAgentRuntime} runtime - The AgentRuntime instance
   */
  constructor(runtime) {
    super(runtime);
    const token = runtime.getSetting("DISCORD_API_TOKEN");
    if (!token || token.trim() === "") {
      logger6.warn("Discord API Token not provided - Discord functionality will be unavailable");
      this.client = null;
      return;
    }
    try {
      this.client = new DiscordJsClient({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildPresences,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessageTyping,
          GatewayIntentBits.GuildMessageTyping,
          GatewayIntentBits.GuildMessageReactions
        ],
        partials: [Partials.Channel, Partials.Message, Partials.User, Partials.Reaction]
      });
      this.runtime = runtime;
      this.voiceManager = new VoiceManager(this, runtime);
      this.messageManager = new MessageManager(this);
      this.client.once(Events.ClientReady, this.onClientReady.bind(this));
      this.client.login(token).catch((error) => {
        logger6.error(`Failed to login to Discord: ${error.message}`);
        this.client = null;
      });
      this.setupEventListeners();
    } catch (error) {
      logger6.error(`Error initializing Discord client: ${error.message}`);
      this.client = null;
    }
  }
  /**
   * Set up event listeners for the client
   */
  setupEventListeners() {
    if (!this.client) {
      return;
    }
    this.client.on("messageCreate", (message) => {
      if (message.author.id === this.client?.user?.id || message.author.bot) {
        return;
      }
      try {
        this.messageManager.handleMessage(message);
      } catch (error) {
        logger6.error(`Error handling message: ${error}`);
      }
    });
    this.client.on("messageReactionAdd", async (reaction, user) => {
      if (user.id === this.client?.user?.id) {
        return;
      }
      try {
        await this.handleReactionAdd(reaction, user);
      } catch (error) {
        logger6.error(`Error handling reaction add: ${error}`);
      }
    });
    this.client.on("messageReactionRemove", async (reaction, user) => {
      if (user.id === this.client?.user?.id) {
        return;
      }
      try {
        await this.handleReactionRemove(reaction, user);
      } catch (error) {
        logger6.error(`Error handling reaction remove: ${error}`);
      }
    });
    this.client.on("guildCreate", async (guild) => {
      try {
        await this.handleGuildCreate(guild);
      } catch (error) {
        logger6.error(`Error handling guild create: ${error}`);
      }
    });
    this.client.on("guildMemberAdd", async (member) => {
      try {
        await this.handleGuildMemberAdd(member);
      } catch (error) {
        logger6.error(`Error handling guild member add: ${error}`);
      }
    });
    this.client.on("interactionCreate", async (interaction) => {
      try {
        await this.handleInteractionCreate(interaction);
      } catch (error) {
        logger6.error(`Error handling interaction: ${error}`);
      }
    });
    this.client.on("userStream", (entityId, name, userName, channel, opusDecoder) => {
      if (entityId !== this.client?.user?.id) {
        this.voiceManager.handleUserStream(entityId, name, userName, channel, opusDecoder);
      }
    });
  }
  /**
   * Handles the event when a new member joins a guild.
   *
   * @param {GuildMember} member - The GuildMember object representing the new member that joined the guild.
   * @returns {Promise<void>} - A Promise that resolves once the event handling is complete.
   */
  async handleGuildMemberAdd(member) {
    logger6.log(`New member joined: ${member.user.username}`);
    const guild = member.guild;
    const tag = member.user.bot ? `${member.user.username}#${member.user.discriminator}` : member.user.username;
    const worldId = createUniqueUuid6(this.runtime, guild.id);
    const entityId = createUniqueUuid6(this.runtime, member.id);
    this.runtime.emitEvent([EventType2.ENTITY_JOINED], {
      runtime: this.runtime,
      entityId,
      worldId,
      source: "discord",
      metadata: {
        originalId: member.id,
        username: tag,
        displayName: member.displayName || member.user.username,
        roles: member.roles.cache.map((r) => r.name),
        joinedAt: member.joinedAt?.getTime()
      }
    });
    this.runtime.emitEvent(["DISCORD_USER_JOINED" /* ENTITY_JOINED */], {
      runtime: this.runtime,
      entityId,
      worldId,
      member,
      guild
    });
  }
  /**
   *
   * Start the Discord service
   * @param {IAgentRuntime} runtime - The runtime for the agent
   * @returns {Promise<DiscordService>} A promise that resolves to a DiscordService instance
   *
   */
  static async start(runtime) {
    const token = runtime.getSetting("DISCORD_API_TOKEN");
    if (!token || token.trim() === "") {
      throw new Error("Discord API Token not provided");
    }
    const maxRetries = 5;
    let retryCount = 0;
    let lastError = null;
    while (retryCount < maxRetries) {
      try {
        const service = new _DiscordService(runtime);
        if (!service.client) {
          throw new Error("Failed to initialize Discord client");
        }
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Discord client ready timeout"));
          }, 3e4);
          service.client?.once("ready", () => {
            clearTimeout(timeout);
            resolve();
          });
        });
        return service;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger6.error(
          `Discord initialization attempt ${retryCount + 1} failed: ${lastError.message}`
        );
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = 2 ** retryCount * 1e3;
          logger6.info(`Retrying Discord initialization in ${delay / 1e3} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw new Error(
      `Discord initialization failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
    );
  }
  /**
   * Stops the Discord client associated with the given runtime.
   *
   * @param {IAgentRuntime} runtime - The runtime associated with the Discord client.
   * @returns {void}
   */
  static async stop(runtime) {
    const client = runtime.getService(DISCORD_SERVICE_NAME);
    if (!client) {
      logger6.error("DiscordService not found");
      return;
    }
    try {
      await client.stop();
    } catch (e) {
      logger6.error("client-discord instance stop err", e);
    }
  }
  /**
   * Asynchronously stops the client by destroying it.
   *
   * @returns {Promise<void>}
   */
  async stop() {
    await this.client?.destroy();
  }
  /**
   * Handle the event when the client is ready.
   * @param {Object} readyClient - The ready client object containing user information.
   * @param {string} readyClient.user.tag - The username and discriminator of the client user.
   * @param {string} readyClient.user.id - The user ID of the client.
   * @returns {Promise<void>}
   */
  async onClientReady(readyClient) {
    logger6.success(`DISCORD: Logged in as ${readyClient.user?.tag}`);
    const commands = [
      {
        name: "joinchannel",
        description: "Join a voice channel",
        options: [
          {
            name: "channel",
            type: 7,
            // CHANNEL type
            description: "The voice channel to join",
            required: true,
            channel_types: [2]
            // GuildVoice type
          }
        ]
      },
      {
        name: "leavechannel",
        description: "Leave the current voice channel"
      }
    ];
    try {
      await this.client?.application?.commands.set(commands);
      logger6.success("DISCORD: Slash commands registered");
    } catch (error) {
      console.error("Error registering slash commands:", error);
    }
    const requiredPermissions = [
      // Text Permissions
      PermissionsBitField2.Flags.ViewChannel,
      PermissionsBitField2.Flags.SendMessages,
      PermissionsBitField2.Flags.SendMessagesInThreads,
      PermissionsBitField2.Flags.CreatePrivateThreads,
      PermissionsBitField2.Flags.CreatePublicThreads,
      PermissionsBitField2.Flags.EmbedLinks,
      PermissionsBitField2.Flags.AttachFiles,
      PermissionsBitField2.Flags.AddReactions,
      PermissionsBitField2.Flags.UseExternalEmojis,
      PermissionsBitField2.Flags.UseExternalStickers,
      PermissionsBitField2.Flags.MentionEveryone,
      PermissionsBitField2.Flags.ManageMessages,
      PermissionsBitField2.Flags.ReadMessageHistory,
      // Voice Permissions
      PermissionsBitField2.Flags.Connect,
      PermissionsBitField2.Flags.Speak,
      PermissionsBitField2.Flags.UseVAD,
      PermissionsBitField2.Flags.PrioritySpeaker
    ].reduce((a, b) => a | b, 0n);
    logger6.success("Use this URL to add the bot to your server:");
    logger6.success(
      `https://discord.com/api/oauth2/authorize?client_id=${readyClient.user?.id}&permissions=${requiredPermissions}&scope=bot%20applications.commands`
    );
    await this.onReady();
  }
  /**
   * Asynchronously retrieves the type of a given channel.
   *
   * @param {Channel} channel - The channel for which to determine the type.
   * @returns {Promise<ChannelType>} A Promise that resolves with the type of the channel.
   */
  async getChannelType(channel) {
    switch (channel.type) {
      case DiscordChannelType4.DM:
        return ChannelType9.DM;
      case DiscordChannelType4.GuildText:
        return ChannelType9.GROUP;
      case DiscordChannelType4.GuildVoice:
        return ChannelType9.VOICE_GROUP;
    }
  }
  /**
   * Handles the addition of a reaction on a message.
   *
   * @param {MessageReaction | PartialMessageReaction} reaction The reaction that was added.
   * @param {User | PartialUser} user The user who added the reaction.
   * @returns {void}
   */
  async handleReactionAdd(reaction, user) {
    try {
      logger6.log("Reaction added");
      if (!reaction || !user) {
        logger6.warn("Invalid reaction or user");
        return;
      }
      let emoji = reaction.emoji.name;
      if (!emoji && reaction.emoji.id) {
        emoji = `<:${reaction.emoji.name}:${reaction.emoji.id}>`;
      }
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          logger6.error("Failed to fetch partial reaction:", error);
          return;
        }
      }
      const timestamp = Date.now();
      const roomId = createUniqueUuid6(this.runtime, reaction.message.channel.id);
      const entityId = createUniqueUuid6(this.runtime, user.id);
      const reactionUUID = createUniqueUuid6(
        this.runtime,
        `${reaction.message.id}-${user.id}-${emoji}-${timestamp}`
      );
      if (!entityId || !roomId) {
        logger6.error("Invalid user ID or room ID", {
          entityId,
          roomId
        });
        return;
      }
      const messageContent = reaction.message.content || "";
      const truncatedContent = messageContent.length > 50 ? `${messageContent.substring(0, 50)}...` : messageContent;
      const reactionMessage = `*Added <${emoji}> to: "${truncatedContent}"*`;
      const userName = reaction.message.author?.username || "unknown";
      const name = reaction.message.author?.displayName || userName;
      await this.runtime.ensureConnection({
        entityId,
        roomId,
        userName,
        name,
        source: "discord",
        channelId: reaction.message.channel.id,
        serverId: reaction.message.guild?.id,
        type: await this.getChannelType(reaction.message.channel)
      });
      const inReplyTo = createUniqueUuid6(this.runtime, reaction.message.id);
      const memory = {
        id: reactionUUID,
        entityId,
        agentId: this.runtime.agentId,
        content: {
          // name,
          // userName,
          text: reactionMessage,
          source: "discord",
          inReplyTo,
          channelType: await this.getChannelType(reaction.message.channel)
        },
        roomId,
        createdAt: timestamp
      };
      const callback = async (content) => {
        if (!reaction.message.channel) {
          logger6.error("No channel found for reaction message");
          return;
        }
        await reaction.message.channel.send(content.text);
        return [];
      };
      this.runtime.emitEvent(["DISCORD_REACTION_RECEIVED", "REACTION_RECEIVED"], {
        runtime: this.runtime,
        message: memory,
        callback
      });
    } catch (error) {
      logger6.error("Error handling reaction:", error);
    }
  }
  /**
   * Handles the removal of a reaction on a message.
   *
   * @param {MessageReaction | PartialMessageReaction} reaction - The reaction that was removed.
   * @param {User | PartialUser} user - The user who removed the reaction.
   * @returns {Promise<void>} - A Promise that resolves after handling the reaction removal.
   */
  async handleReactionRemove(reaction, user) {
    try {
      logger6.log("Reaction removed");
      let emoji = reaction.emoji.name;
      if (!emoji && reaction.emoji.id) {
        emoji = `<:${reaction.emoji.name}:${reaction.emoji.id}>`;
      }
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          logger6.error("Something went wrong when fetching the message:", error);
          return;
        }
      }
      const messageContent = reaction.message.content || "";
      const truncatedContent = messageContent.length > 50 ? `${messageContent.substring(0, 50)}...` : messageContent;
      const reactionMessage = `*Removed <${emoji}> from: "${truncatedContent}"*`;
      const roomId = createUniqueUuid6(this.runtime, reaction.message.channel.id);
      const entityId = createUniqueUuid6(this.runtime, user.id);
      const timestamp = Date.now();
      const reactionUUID = createUniqueUuid6(
        this.runtime,
        `${reaction.message.id}-${user.id}-${emoji}-${timestamp}`
      );
      const userName = reaction.message.author?.username || "unknown";
      const name = reaction.message.author?.displayName || userName;
      await this.runtime.ensureConnection({
        entityId,
        roomId,
        userName,
        name,
        source: "discord",
        channelId: reaction.message.channel.id,
        serverId: reaction.message.guild?.id,
        type: await this.getChannelType(reaction.message.channel)
      });
      const memory = {
        id: reactionUUID,
        entityId,
        agentId: this.runtime.agentId,
        content: {
          // name,
          // userName,
          text: reactionMessage,
          source: "discord",
          inReplyTo: createUniqueUuid6(this.runtime, reaction.message.id),
          channelType: await this.getChannelType(reaction.message.channel)
        },
        roomId,
        createdAt: Date.now()
      };
      const callback = async (content) => {
        if (!reaction.message.channel) {
          logger6.error("No channel found for reaction message");
          return;
        }
        await reaction.message.channel.send(content.text);
        return [];
      };
      this.runtime.emitEvent(["DISCORD_REACTION_RECEIVED" /* REACTION_RECEIVED */], {
        runtime: this.runtime,
        message: memory,
        callback
      });
    } catch (error) {
      logger6.error("Error handling reaction removal:", error);
    }
  }
  /**
   * Handles the event when the bot joins a guild. It logs the guild name, fetches additional information about the guild, scans the guild for voice data, creates standardized world data structure, generates unique IDs, and emits events to the runtime.
   * @param {Guild} guild - The guild that the bot has joined.
   * @returns {Promise<void>}
   */
  async handleGuildCreate(guild) {
    logger6.log(`Joined guild ${guild.name}`);
    const fullGuild = await guild.fetch();
    this.voiceManager.scanGuild(guild);
    const ownerId = createUniqueUuid6(this.runtime, fullGuild.ownerId);
    const worldId = createUniqueUuid6(this.runtime, fullGuild.id);
    const standardizedData = {
      runtime: this.runtime,
      rooms: await this.buildStandardizedRooms(fullGuild, worldId),
      users: await this.buildStandardizedUsers(fullGuild),
      world: {
        id: worldId,
        name: fullGuild.name,
        agentId: this.runtime.agentId,
        serverId: fullGuild.id,
        metadata: {
          ownership: fullGuild.ownerId ? { ownerId } : void 0,
          roles: {
            [ownerId]: Role.OWNER
          }
        }
      },
      source: "discord"
    };
    this.runtime.emitEvent(["DISCORD_WORLD_JOINED" /* WORLD_JOINED */], {
      runtime: this.runtime,
      server: fullGuild,
      source: "discord"
    });
    this.runtime.emitEvent([EventType2.WORLD_JOINED], standardizedData);
  }
  /**
   * Handles interactions created by the user, specifically commands.
   * @param {any} interaction - The interaction object received
   * @returns {void}
   */
  async handleInteractionCreate(interaction) {
    if (!interaction.isCommand()) return;
    switch (interaction.commandName) {
      case "joinchannel":
        await this.voiceManager.handleJoinChannelCommand(interaction);
        break;
      case "leavechannel":
        await this.voiceManager.handleLeaveChannelCommand(interaction);
        break;
    }
  }
  /**
   * Builds a standardized list of rooms from Discord guild channels
   */
  /**
   * Build standardized rooms for a guild based on text and voice channels.
   *
   * @param {Guild} guild The guild to build rooms for.
   * @param {UUID} _worldId The ID of the world to associate with the rooms.
   * @returns {Promise<any[]>} An array of standardized room objects.
   */
  async buildStandardizedRooms(guild, _worldId) {
    const rooms = [];
    for (const [channelId, channel] of guild.channels.cache) {
      if (channel.type === DiscordChannelType4.GuildText || channel.type === DiscordChannelType4.GuildVoice) {
        const roomId = createUniqueUuid6(this.runtime, channelId);
        let channelType;
        switch (channel.type) {
          case DiscordChannelType4.GuildText:
            channelType = ChannelType9.GROUP;
            break;
          case DiscordChannelType4.GuildVoice:
            channelType = ChannelType9.VOICE_GROUP;
            break;
          default:
            channelType = ChannelType9.GROUP;
        }
        let participants = [];
        if (guild.memberCount < 1e3 && channel.type === DiscordChannelType4.GuildText) {
          try {
            participants = Array.from(guild.members.cache.values()).filter(
              (member) => channel.permissionsFor(member)?.has(PermissionsBitField2.Flags.ViewChannel)
            ).map((member) => createUniqueUuid6(this.runtime, member.id));
          } catch (error) {
            logger6.warn(`Failed to get participants for channel ${channel.name}:`, error);
          }
        }
        rooms.push({
          id: roomId,
          name: channel.name,
          type: channelType,
          channelId: channel.id,
          participants
        });
      }
    }
    return rooms;
  }
  /**
   * Builds a standardized list of users from Discord guild members
   */
  async buildStandardizedUsers(guild) {
    const entities = [];
    const botId = this.client?.user?.id;
    if (guild.memberCount > 1e3) {
      logger6.info(
        `Using optimized user sync for large guild ${guild.name} (${guild.memberCount} members)`
      );
      try {
        for (const [, member] of guild.members.cache) {
          const tag = member.user.bot ? `${member.user.username}#${member.user.discriminator}` : member.user.username;
          if (member.id !== botId) {
            entities.push({
              id: createUniqueUuid6(this.runtime, member.id),
              names: Array.from(
                /* @__PURE__ */ new Set([member.user.username, member.displayName, member.user.globalName])
              ),
              agentId: this.runtime.agentId,
              metadata: {
                default: {
                  username: tag,
                  name: member.displayName || member.user.username
                },
                discord: member.user.globalName ? {
                  username: tag,
                  name: member.displayName || member.user.username,
                  globalName: member.user.globalName,
                  userId: member.id
                } : {
                  username: tag,
                  name: member.displayName || member.user.username,
                  userId: member.id
                }
              }
            });
          }
        }
        if (entities.length < 100) {
          logger6.info(`Adding online members for ${guild.name}`);
          const onlineMembers = await guild.members.fetch({ limit: 100 });
          for (const [, member] of onlineMembers) {
            if (member.id !== botId) {
              const entityId = createUniqueUuid6(this.runtime, member.id);
              if (!entities.some((u) => u.id === entityId)) {
                const tag = member.user.bot ? `${member.user.username}#${member.user.discriminator}` : member.user.username;
                entities.push({
                  id: entityId,
                  names: Array.from(
                    /* @__PURE__ */ new Set([member.user.username, member.displayName, member.user.globalName])
                  ),
                  agentId: this.runtime.agentId,
                  metadata: {
                    default: {
                      username: tag,
                      name: member.displayName || member.user.username
                    },
                    discord: member.user.globalName ? {
                      username: tag,
                      name: member.displayName || member.user.username,
                      globalName: member.user.globalName,
                      userId: member.id
                    } : {
                      username: tag,
                      name: member.displayName || member.user.username,
                      userId: member.id
                    }
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        logger6.error(`Error fetching members for ${guild.name}:`, error);
      }
    } else {
      try {
        let members = guild.members.cache;
        if (members.size === 0) {
          members = await guild.members.fetch();
        }
        for (const [, member] of members) {
          if (member.id !== botId) {
            const tag = member.user.bot ? `${member.user.username}#${member.user.discriminator}` : member.user.username;
            entities.push({
              id: createUniqueUuid6(this.runtime, member.id),
              names: Array.from(
                /* @__PURE__ */ new Set([member.user.username, member.displayName, member.user.globalName])
              ),
              agentId: this.runtime.agentId,
              metadata: {
                default: {
                  username: tag,
                  name: member.displayName || member.user.username
                },
                discord: member.user.globalName ? {
                  username: tag,
                  name: member.displayName || member.user.username,
                  globalName: member.user.globalName,
                  userId: member.id
                } : {
                  username: tag,
                  name: member.displayName || member.user.username,
                  userId: member.id
                }
              }
            });
          }
        }
      } catch (error) {
        logger6.error(`Error fetching members for ${guild.name}:`, error);
      }
    }
    return entities;
  }
  async onReady() {
    logger6.log("DISCORD ON READY");
    const guilds = await this.client?.guilds.fetch();
    for (const [, guild] of guilds) {
      const fullGuild = await guild.fetch();
      await this.voiceManager.scanGuild(fullGuild);
      setTimeout(async () => {
        const fullGuild2 = await guild.fetch();
        logger6.log("DISCORD SERVER CONNECTED", fullGuild2.name);
        this.runtime.emitEvent(["DISCORD_SERVER_CONNECTED" /* WORLD_CONNECTED */], {
          runtime: this.runtime,
          server: fullGuild2,
          source: "discord"
        });
        const worldId = createUniqueUuid6(this.runtime, fullGuild2.id);
        const ownerId = createUniqueUuid6(this.runtime, fullGuild2.ownerId);
        const standardizedData = {
          name: fullGuild2.name,
          runtime: this.runtime,
          rooms: await this.buildStandardizedRooms(fullGuild2, worldId),
          entities: await this.buildStandardizedUsers(fullGuild2),
          world: {
            id: worldId,
            name: fullGuild2.name,
            agentId: this.runtime.agentId,
            serverId: fullGuild2.id,
            metadata: {
              ownership: fullGuild2.ownerId ? { ownerId } : void 0,
              roles: {
                [ownerId]: Role.OWNER
              }
            }
          },
          source: "discord"
        };
        this.runtime.emitEvent([EventType2.WORLD_CONNECTED], standardizedData);
      }, 1e3);
    }
    this.client?.emit("voiceManagerReady");
  }
};

// src/tests.ts
import {
  AudioPlayerStatus,
  NoSubscriberBehavior as NoSubscriberBehavior2,
  VoiceConnectionStatus as VoiceConnectionStatus2,
  createAudioPlayer as createAudioPlayer2,
  createAudioResource as createAudioResource2,
  entersState as entersState2
} from "@discordjs/voice";
import { ModelType as ModelType9, logger as logger7 } from "@elizaos/core";
import { ChannelType as ChannelType10, Events as Events2 } from "discord.js";
var TEST_IMAGE_URL = "https://github.com/elizaOS/awesome-eliza/blob/main/assets/eliza-logo.jpg?raw=true";
var DiscordTestSuite = class {
  name = "discord";
  discordClient = null;
  tests;
  /**
   * Constructor for initializing the tests array with test cases to be executed.
   *
   * @constructor
   * @this {TestSuite}
   */
  constructor() {
    this.tests = [
      {
        name: "Initialize Discord Client",
        fn: this.testCreatingDiscordClient.bind(this)
      },
      {
        name: "Slash Commands - Join Voice",
        fn: this.testJoinVoiceSlashCommand.bind(this)
      },
      {
        name: "Voice Playback & TTS",
        fn: this.testTextToSpeechPlayback.bind(this)
      },
      {
        name: "Send Message with Attachments",
        fn: this.testSendingTextMessage.bind(this)
      },
      {
        name: "Handle Incoming Messages",
        fn: this.testHandlingMessage.bind(this)
      },
      {
        name: "Slash Commands - Leave Voice",
        fn: this.testLeaveVoiceSlashCommand.bind(this)
      }
    ];
  }
  /**
   * Asynchronously tests the creation of Discord client using the provided runtime.
   *
   * @param {IAgentRuntime} runtime - The agent runtime used to obtain the Discord service.
   * @returns {Promise<void>} - A Promise that resolves once the Discord client is ready.
   * @throws {Error} - If an error occurs while creating the Discord client.
   */
  async testCreatingDiscordClient(runtime) {
    try {
      this.discordClient = runtime.getService(ServiceType2.DISCORD);
      if (this.discordClient.client.isReady()) {
        logger7.success("DiscordService is already ready.");
      } else {
        logger7.info("Waiting for DiscordService to be ready...");
        await new Promise((resolve, reject) => {
          this.discordClient.client.once(Events2.ClientReady, resolve);
          this.discordClient.client.once(Events2.Error, reject);
        });
      }
    } catch (error) {
      throw new Error(`Error in test creating Discord client: ${error}`);
    }
  }
  /**
   * Asynchronously tests the join voice slash command functionality.
   *
   * @param {IAgentRuntime} runtime - The runtime environment for the agent.
   * @returns {Promise<void>} - A promise that resolves once the test is complete.
   * @throws {Error} - If there is an error in executing the slash command test.
   */
  async testJoinVoiceSlashCommand(runtime) {
    try {
      await this.waitForVoiceManagerReady(this.discordClient);
      const channel = await this.getTestChannel(runtime);
      if (!channel || !channel.isTextBased()) {
        throw new Error("Invalid test channel for slash command test.");
      }
      const fakeJoinInteraction = {
        isCommand: () => true,
        commandName: "joinchannel",
        options: {
          get: (name) => name === "channel" ? { value: channel.id } : null
        },
        guild: channel.guild,
        deferReply: async () => {
        },
        editReply: async (message) => {
          logger7.info(`JoinChannel Slash Command Response: ${message}`);
        }
      };
      await this.discordClient.voiceManager.handleJoinChannelCommand(fakeJoinInteraction);
      logger7.success("Slash command test completed successfully.");
    } catch (error) {
      throw new Error(`Error in slash commands test: ${error}`);
    }
  }
  /**
   * Asynchronously tests the leave voice channel slash command.
   *
   * @param {IAgentRuntime} runtime - The Agent Runtime instance.
   * @returns {Promise<void>} A promise that resolves when the test is complete.
   */
  async testLeaveVoiceSlashCommand(runtime) {
    try {
      await this.waitForVoiceManagerReady(this.discordClient);
      const channel = await this.getTestChannel(runtime);
      if (!channel || !channel.isTextBased()) {
        throw new Error("Invalid test channel for slash command test.");
      }
      const fakeLeaveInteraction = {
        isCommand: () => true,
        commandName: "leavechannel",
        guildId: channel.guildId,
        reply: async (message) => {
          logger7.info(`LeaveChannel Slash Command Response: ${message}`);
        }
      };
      await this.discordClient.voiceManager.handleLeaveChannelCommand(fakeLeaveInteraction);
      logger7.success("Slash command test completed successfully.");
    } catch (error) {
      throw new Error(`Error in slash commands test: ${error}`);
    }
  }
  /**
   * Test Text to Speech playback.
   * @param {IAgentRuntime} runtime - The Agent Runtime instance.
   * @throws {Error} - If voice channel is invalid, voice connection fails to become ready, or no text to speech service found.
   */
  async testTextToSpeechPlayback(runtime) {
    try {
      await this.waitForVoiceManagerReady(this.discordClient);
      const channel = await this.getTestChannel(runtime);
      if (!channel || channel.type !== ChannelType10.GuildVoice) {
        throw new Error("Invalid voice channel.");
      }
      await this.discordClient.voiceManager.joinChannel(channel);
      const guild = await this.getActiveGuild(this.discordClient);
      const guildId = guild.id;
      const connection = this.discordClient.voiceManager.getVoiceConnection(guildId);
      try {
        await entersState2(connection, VoiceConnectionStatus2.Ready, 1e4);
        logger7.success(`Voice connection is ready in guild: ${guildId}`);
      } catch (error) {
        throw new Error(`Voice connection failed to become ready: ${error}`);
      }
      let responseStream = null;
      try {
        responseStream = await runtime.useModel(
          ModelType9.TEXT_TO_SPEECH,
          `Hi! I'm ${runtime.character.name}! How are you doing today?`
        );
      } catch (_error) {
        throw new Error("No text to speech service found");
      }
      if (!responseStream) {
        throw new Error("TTS response stream is null or undefined.");
      }
      await this.playAudioStream(responseStream, connection);
    } catch (error) {
      throw new Error(`Error in TTS playback test: ${error}`);
    }
  }
  /**
   * Asynchronously tests sending a text message to a specified channel.
   *
   * @param {IAgentRuntime} runtime - The runtime for the agent.
   * @returns {Promise<void>} A Promise that resolves when the message is sent successfully.
   * @throws {Error} If there is an error in sending the text message.
   */
  async testSendingTextMessage(runtime) {
    try {
      const channel = await this.getTestChannel(runtime);
      await this.sendMessageToChannel(channel, "Testing Message", [TEST_IMAGE_URL]);
    } catch (error) {
      throw new Error(`Error in sending text message: ${error}`);
    }
  }
  /**
   * Asynchronously handles sending a test message using the given runtime and mock user data.
   *
   * @param {IAgentRuntime} runtime - The agent runtime object.
   * @returns {Promise<void>} A Promise that resolves once the message is handled.
   */
  async testHandlingMessage(runtime) {
    try {
      const channel = await this.getTestChannel(runtime);
      const fakeMessage = {
        content: `Hello, ${runtime.character.name}! How are you?`,
        author: {
          id: "mock-user-id",
          username: "MockUser",
          bot: false
        },
        channel,
        id: "mock-message-id",
        createdTimestamp: Date.now(),
        mentions: {
          has: () => false
        },
        reference: null,
        attachments: []
      };
      await this.discordClient.messageManager.handleMessage(fakeMessage);
    } catch (error) {
      throw new Error(`Error in sending text message: ${error}`);
    }
  }
  // #############################
  //     Utility Functions
  // #############################
  /**
   * Asynchronously retrieves the test channel associated with the provided runtime.
   *
   * @param {IAgentRuntime} runtime - The runtime object containing necessary information.
   * @returns {Promise<Channel>} The test channel retrieved from the Discord client.
   * @throws {Error} If no test channel is found.
   */
  async getTestChannel(runtime) {
    const channelId = this.validateChannelId(runtime);
    const channel = await this.discordClient.client.channels.fetch(channelId);
    if (!channel) throw new Error("no test channel found!");
    return channel;
  }
  /**
   * Async function to send a message to a text-based channel.
   *
   * @param {TextChannel} channel - The text-based channel the message is being sent to.
   * @param {string} messageContent - The content of the message being sent.
   * @param {any[]} files - An array of files to include in the message.
   * @throws {Error} If the channel is not a text-based channel or does not exist.
   * @throws {Error} If there is an error sending the message.
   */
  async sendMessageToChannel(channel, messageContent, files) {
    try {
      if (!channel || !channel.isTextBased()) {
        throw new Error("Channel is not a text-based channel or does not exist.");
      }
      await sendMessageInChunks(channel, messageContent, null, files);
    } catch (error) {
      throw new Error(`Error sending message: ${error}`);
    }
  }
  /**
   * Play an audio stream from a given response stream using the provided VoiceConnection.
   *
   * @param {any} responseStream - The response stream to play as audio.
   * @param {VoiceConnection} connection - The VoiceConnection to use for playing the audio.
   * @returns {Promise<void>} - A Promise that resolves when the TTS playback is finished.
   */
  async playAudioStream(responseStream, connection) {
    const audioPlayer = createAudioPlayer2({
      behaviors: {
        noSubscriber: NoSubscriberBehavior2.Pause
      }
    });
    const audioResource = createAudioResource2(responseStream);
    audioPlayer.play(audioResource);
    connection.subscribe(audioPlayer);
    logger7.success("TTS playback started successfully.");
    await new Promise((resolve, reject) => {
      audioPlayer.once(AudioPlayerStatus.Idle, () => {
        logger7.info("TTS playback finished.");
        resolve();
      });
      audioPlayer.once("error", (error) => {
        reject(error);
        throw new Error(`TTS playback error: ${error}`);
      });
    });
  }
  /**
   * Retrieves the active guild where the bot is currently connected to a voice channel.
   *
   * @param {DiscordService} discordClient The DiscordService instance used to interact with the Discord API.
   * @returns {Promise<Guild>} The active guild where the bot is currently connected to a voice channel.
   * @throws {Error} If no active voice connection is found for the bot.
   */
  async getActiveGuild(discordClient) {
    const guilds = await discordClient.client.guilds.fetch();
    const fullGuilds = await Promise.all(guilds.map((guild) => guild.fetch()));
    const activeGuild = fullGuilds.find((g) => g.members.me?.voice.channelId);
    if (!activeGuild) {
      throw new Error("No active voice connection found for the bot.");
    }
    return activeGuild;
  }
  /**
   * Waits for the VoiceManager in the Discord client to be ready.
   *
   * @param {DiscordService} discordClient - The Discord client to check for VoiceManager readiness.
   * @throws {Error} If the Discord client is not initialized.
   * @returns {Promise<void>} A promise that resolves when the VoiceManager is ready.
   */
  async waitForVoiceManagerReady(discordClient) {
    if (!discordClient) {
      throw new Error("Discord client is not initialized.");
    }
    if (!discordClient.voiceManager.isReady()) {
      await new Promise((resolve, reject) => {
        discordClient.voiceManager.once("ready", resolve);
        discordClient.voiceManager.once("error", reject);
      });
    }
  }
  /**
   * Validates the Discord test channel ID by checking if it is set in the runtime or environment variables.
   * If the test channel ID is not set, an error is thrown.
   *
   * @param {IAgentRuntime} runtime The runtime object containing the settings and environment variables.
   * @returns {string} The validated Discord test channel ID.
   */
  validateChannelId(runtime) {
    const testChannelId = runtime.getSetting("DISCORD_TEST_CHANNEL_ID") || process.env.DISCORD_TEST_CHANNEL_ID;
    if (!testChannelId) {
      throw new Error(
        "DISCORD_TEST_CHANNEL_ID is not set. Please provide a valid channel ID in the environment variables."
      );
    }
    return testChannelId;
  }
};

// src/index.ts
var discordPlugin = {
  name: "discord",
  description: "Discord service plugin for integration with Discord servers and channels",
  services: [DiscordService],
  actions: [chatWithAttachments_default, downloadMedia, joinVoice, leaveVoice, summarize, transcribeMedia],
  providers: [channelStateProvider, voiceStateProvider],
  tests: [new DiscordTestSuite()],
  init: async (config, runtime) => {
    const token = runtime.getSetting("DISCORD_API_TOKEN");
    if (!token || token.trim() === "") {
      logger8.warn(
        "Discord API Token not provided - Discord plugin is loaded but will not be functional"
      );
      logger8.warn(
        "To enable Discord functionality, please provide DISCORD_API_TOKEN in your .eliza/.env file"
      );
    }
  }
};
var index_default = discordPlugin;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map