<template>
  <span>
    <span
      v-for="(letter, index) in displayedText"
      :key="index"
      class="letter"
      >{{ letter }}</span
    >
  </span>
</template>

<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
});

const displayedText = ref("");
const delay = 25;

function startStreaming() {
  let currentIndex = 0;
  const interval = setInterval(() => {
    if (currentIndex < props.text.length) {
      displayedText.value += props.text[currentIndex];
      currentIndex++;
    } else {
      clearInterval(interval);
    }
  }, delay);
}

onMounted(() => {
  startStreaming();
});
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.letter {
  animation: fade-in 0.3s ease-out;
  animation-fill-mode: both;
  opacity: 0;
}
</style>
