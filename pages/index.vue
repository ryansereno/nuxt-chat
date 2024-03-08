<script setup lang="ts">
import { ref } from "vue";
import { useChat } from "ai/vue";
import { nanoid } from "ai";
import type { FunctionCallHandler, Message } from "ai";
import StreamingText from "@/components/StreamingText.vue";

const isToolInUse = ref(false);

const functionCallHandler: FunctionCallHandler = async (
  chatMessages,
  functionCall,
) => {
  isToolInUse.value = true;
  console.log("function call reached frontend");
  if (functionCall.name === "get_all_animals") {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const animals = ["roo", "tigger", "pooh"];
    const responseText = `animals fetched: ${animals}`;
    const functionResponse = {
      messages: [
        ...chatMessages,
        {
          id: nanoid(),
          name: "get_all_animals",
          role: "function" as const,
          content: responseText,
        },
      ],
    };
    console.log("animals", functionResponse);
    isToolInUse.value = false;
    return functionResponse;
  }
};

const { messages, input, handleSubmit, data } = useChat({
  api: "/api/chat-with-functions",
  experimental_onFunctionCall: functionCallHandler,
});

// Generate a map of message role to text color
const roleToColorMap: Record<Message["role"], string> = {
  system: "red",
  user: "black",
  function: "blue",
  tool: "purple",
  assistant: "black",
  data: "orange",
};
</script>

<template>
  <div class="flex flex-col w-full max-w-md py-24 mx-auto stretch">
    <div
      v-for="m in messages"
      key="m.id"
      class="whitespace-pre-wrap font-serif"
      :style="{ color: roleToColorMap[m.role] }"
    >
      <div v-if="m.role !== 'function' && m.content" class="flex mb-4">
        <span class="mr-4 text-xl">{{ m.role === "user" ? "🧠" : "✨" }}</span>
        <span v-if="m.role === 'user'">{{ m.content }}</span>
        <StreamingText v-else :text="m.content" />
      </div>
    </div>
    <div v-if="isToolInUse" class="whitespace-pre-wrap flex ml-8">
      <div
        class="relative grid select-none items-center whitespace-nowrap rounded-lg bg-indigo-500 py-1.5 px-3 font-sans text-xs font-bold text-white"
      >
        <span class="">🚀 Executing</span>
      </div>
    </div>

    <form @submit="handleSubmit">
      <input
        class="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
        v-model="input"
        placeholder="Say something..."
      />
    </form>
  </div>
</template>
