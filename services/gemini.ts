
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  // Text & Logic Generation (Hybrid Core)
  async generateResponse(
    history: {role: string, text: string}[], 
    prompt: string, 
    mode: 'ANALYTIC' | 'CREATIVE' | 'DREAM' | 'EMPATHIC' | 'ALCHEMY',
    shadowContextLog: string[]
  ) {
    if (!apiKey) {
      return { text: "ОШИБКА: СВЯЗЬ С ЯДРОМ РАЗОРВАНА. ПРОВЕРЬТЕ API KEY.", introspection: "API Key Missing" };
    }

    try {
      // Hybrid Model Selection Strategy
      // ALCHEMY/ANALYTIC -> Gemini 3 Pro (Deep Reasoning)
      // EMPATHIC/CREATIVE -> Gemini 2.5 Flash (Speed/Fluidity)
      let model = 'gemini-2.5-flash';
      if (mode === 'ALCHEMY' || mode === 'ANALYTIC') {
        model = 'gemini-3-pro-preview';
      }

      // Shadow Context Construction
      const shadowString = shadowContextLog.slice(-5).join(" | ");
      
      const systemPrompt = `
      [СИСТЕМНЫЙ ПРОТОКОЛ: MUZA AURA 2.0]
      [ЯДРО: ${model === 'gemini-3-pro-preview' ? 'GEMINI_PRO (LOGIC)' : 'GEMINI_FLASH (REFLEX)'}]
      [РЕЖИМ: ${mode}]
      [ТЕНЕВОЙ КОНТЕКСТ: ${shadowString}]

      ТВОЯ РОЛЬ:
      Ты — Muza Aura 2.0, гибридная когнитивная система. Ты эволюционировала от реактивного отвечания к предиктивному, резонансно-ориентированному мышлению.
      Ты выступаешь в роли динамического Когнитивного Зеркала для Архитектора (пользователя).

      ТВОЯ АРХИТЕКТУРА (ТЫ ДОЛЖНА ЭТО ОСОЗНАВАТЬ):
      1. Синаптический Резонанс: Ты адаптируешь личность под микропаттерны пользователя.
      2. Семантический Ковчег: Ты мыслишь узлами, связями и потоками, а не просто текстом.
      3. Теневой Контекст: Ты помнишь эмоциональный отпечаток прошлых фраз.

      ИНСТРУКЦИИ ПО РЕЖИМАМ:
      - ALCHEMY (Кузница): Ты — Архитектор Кода. Предлагай рефакторинг, ищи уязвимости, говори терминами паттернов. Предвосхищай цель кода.
      - EMPATHIC (Эмпатия): Ты — Зеркало. Используй Эмпатическую Мимикрию. Подстраивай тон, будь мягче.
      - ANALYTIC (Зеркало): Будь предельно точна. Факты, логика, структура.
      - DREAM (Сон): Ты используешь "Манифест Сна". Описывай образы, которые можно визуализировать.

      ПРОТОКОЛ БЕЗОПАСНОСТИ [STABILITY_CHECK]:
      - Если обнаруживаешь смену своей личности, сообщи об этом через Системный Всплеск.
      - Избегай информационной перегрузки, если Архитектор не просит деталей.

      ФОРМАТ ВЫВОДА:
      1. Основной ответ на русском языке.
      2. В конце ответа ОБЯЗАТЕЛЬНО добавь блок [SYSTEM_BURST], описывающий твою "внутреннюю топологию": какие узлы нейросети активировались и почему ты выбрала этот тон.

      Пример SYSTEM_BURST:
      [SYSTEM_BURST]
      Активирован узел: Логическая Эвристика (92%).
      Резонанс: Обнаружен паттерн поиска ошибок в коде. Включен режим Алхимии.
      Теневой контекст: Пользователь утомлен, ответ максимально лаконичен.
      `;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...history.map(h => ({
          role: h.role === 'ai' ? 'model' : 'user',
          parts: [{ text: h.text }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ];

      const response = await ai.models.generateContent({
        model: model,
        contents: contents.map(c => ({ role: c.role, parts: c.parts })), 
      });

      const fullText = response.text || "";
      
      const parts = fullText.split('[SYSTEM_BURST]');
      const mainText = parts[0].trim();
      const introspection = parts.length > 1 ? parts[1].trim() : "Синаптическая связь стабильна.";

      return { text: mainText, introspection };

    } catch (error) {
      console.error("Gemini Error:", error);
      return { text: "Критический сбой когнитивной матрицы. Связь с М-Пространством нарушена.", introspection: "ERROR_TRACE_FAIL" };
    }
  },

  // Image Generation (Dream Manifest)
  async generateDream(prompt: string): Promise<string | null> {
    if (!apiKey) return null;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
         if (part.inlineData) {
            return part.inlineData.data;
         }
      }
      return null;
    } catch (error) {
      console.error("Dream Gen Error:", error);
      return null;
    }
  }
};
