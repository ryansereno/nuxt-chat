import {
  OpenAIStream,
  StreamingTextResponse,
  experimental_StreamData,
} from "ai";
import OpenAI from "openai";
import type { ChatCompletionCreateParams } from "openai/resources/chat";
import axios from "axios";

const functions: ChatCompletionCreateParams.Function[] = [
  {
    name: "get_current_weather",
    description: "Get the current weather.",
    parameters: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "The temperature unit to use.",
        },
      },
      required: ["format"],
    },
  },
  {
    name: "get_all_items",
    description: "Get all items of a project.",
  },
  {
    name: "get_all_animals",
    description: "Get all animals available to the user.",
  },
];

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey;
  if (!apiKey) throw new Error("Missing OpenAI API key");
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  return defineEventHandler(async (event: any) => {
    const { messages } = await readBody(event);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0613",
      stream: true,
      messages,
      functions,
    });

    const data = new experimental_StreamData();
    const stream = OpenAIStream(response, {
      experimental_onFunctionCall: async (
        { name, arguments: args },
        createFunctionCallMessages,
      ) => {
        if (name === "get_current_weather") {
          // Call a weather API here
          const weatherData = {
            temperature: 20,
            unit: args.format === "celsius" ? "C" : "F",
          };

          data.append({
            text: "Some custom data",
          });

          const newMessages = createFunctionCallMessages(weatherData);
          return openai.chat.completions.create({
            messages: [...messages, ...newMessages],
            stream: true,
            model: "gpt-3.5-turbo-0613",
          });
        }

        if (name === "get_all_items") {
          console.log("get_all_items id param:", args.id);
          // Simulate calling an API to fetch items.
          try {
            const itemNames = [
              "Monet Painting",
              "Van Gogh Painting",
              "Picasso Painting",
            ];
            const responseText = `items fetched: ${itemNames}`;

            data.append({ text: responseText });

            const newMessages = createFunctionCallMessages({
              text: responseText,
            });
            console.log("newMessages---", newMessages, "------");
            return openai.chat.completions.create({
              messages: [...messages, ...newMessages],
              stream: true,
              model: "gpt-3.5-turbo-0613",
            });
          } catch (error) {
            console.error("Error fetching items:", error);
            // Handle errors, e.g., append an error message to the data stream.
            data.append({ text: "Failed to fetch items." });
            // Potentially, you should still return a response to avoid hanging the process
            return openai.chat.completions.create({
              messages: messages,
              stream: true,
              model: "gpt-3.5-turbo-0613",
            });
          }
        }
      },
      onCompletion(completion) {
        console.log("completion", completion);
      },
      onFinal(completion) {
        data.close();
      },
      experimental_streamData: true,
    });

    data.append({
      text: "Hello, how are you?",
    });

    return new StreamingTextResponse(stream, {}, data);
  });
});
