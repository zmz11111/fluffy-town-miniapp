// 由 daily-plan.json 同步生成，字段和值保持一致。
module.exports = {
  "schemaVersion": "0.1-draft",
  "id": "wj-g3-v1:welcome:daily-lesson-1",
  "unitId": "wj-g3-v1:welcome",
  "taskId": "wj-g3-v1:welcome:task-greeting-and-introduction",
  "title": "Welcome 第一次学习",
  "recommendedMinutes": 15,
  "openingMinutes": 1,
  "closingMinutes": 2,
  "activities": [
    {
      "id": "new-words",
      "type": "new-word-learning",
      "durationMinutes": 4,
      "vocabularyIds": [
        "wj-g3-v1:welcome:hello",
        "wj-g3-v1:welcome:hi",
        "wj-g3-v1:welcome:name"
      ],
      "objectiveIds": [
        "greet-in-context",
        "introduce-self"
      ]
    },
    {
      "id": "sentence-practice",
      "type": "sentence-practice",
      "durationMinutes": 4,
      "sentenceIds": [
        "wj-g3-v1:welcome:sentence-my-name-is",
        "wj-g3-v1:welcome:sentence-im"
      ],
      "objectiveIds": [
        "introduce-self"
      ]
    },
    {
      "id": "listening",
      "type": "listening-task",
      "durationMinutes": 3,
      "vocabularyIds": [
        "wj-g3-v1:welcome:hello",
        "wj-g3-v1:welcome:hi"
      ],
      "objectiveIds": [
        "greet-in-context"
      ]
    },
    {
      "id": "tuantuan-interaction",
      "type": "companion-interaction",
      "durationMinutes": 1,
      "objectiveIds": [
        "greet-in-context"
      ]
    }
  ],
  "reviewStatus": "pending_human_review",
  "releaseStatus": "development_preview_only",
  "editorialNote": "此为 Welcome 的第一份可执行学习任务，按一次约 15 分钟安排；完整 27 词分散在后续学习日，不在本次一次测完。"
};
