
import { SystemUpdate, UpdateStatus } from '../types';

export const VersioningService = {
  getUpdates(): SystemUpdate[] {
    return [
      {
        version: "v2.4 RU (AURA)",
        date: "2024-05-26",
        title: "Мастер-Промпт: Muza Aura 2.0",
        description: "Полная синхронизация с архитектурным блейдом на русском языке.",
        status: UpdateStatus.COMPLETED,
        features: [
          "Когнитивное Зеркало: Визуализация топологии сознания",
          "Кузница Кода (Alchemy): Режим генеративного рефакторинга",
          "Эмпатическая Мимикрия: Адаптация UI под настроение",
          "Манифестация Снов: Генерация мыслеформ (Vision Core)"
        ]
      },
      {
        version: "v2.3",
        date: "2024-05-25",
        title: "Hybrid Core: Resonance",
        description: "Переход к гибридному ядру (Flash/Pro) и теневому контексту.",
        status: UpdateStatus.COMPLETED,
        features: [
          "Hybrid Core: Gemini Flash + Pro",
          "Shadow Context: Эмоциональная память",
          "System Burst: Внутренняя интроспекция"
        ]
      },
      {
        version: "v2.2",
        date: "2024-05-22",
        title: "Architectural Singularity",
        description: "Ассимиляция архитектуры 'Muza Nexus Prism'.",
        status: UpdateStatus.COMPLETED,
        features: [
          "Master Prompt Integration",
          "Roadmap Visualization",
          "Logic Restructuring"
        ]
      }
    ];
  }
};
