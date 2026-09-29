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
  "releaseSessions": [
    {
      "id": "welcome-session-01",
      "taskId": "wj-g3-v1:welcome:task-greeting-and-introduction",
      "title": "第1课：打个招呼",
      "prompt": "我们先认识 Hello、Hi 和 name，再听听团团怎么问候。",
      "recommendedMinutes": 15,
      "vocabularyIds": [
        "wj-g3-v1:welcome:hello",
        "wj-g3-v1:welcome:hi",
        "wj-g3-v1:welcome:name"
      ],
      "sentenceIds": [
        "wj-g3-v1:welcome:sentence-my-name-is",
        "wj-g3-v1:welcome:sentence-im"
      ],
      "objectiveIdsToComplete": [],
      "includeCompanionInteraction": true
    },
    {
      "id": "welcome-session-02",
      "taskId": "wj-g3-v1:welcome:task-self-introduction",
      "title": "第2课：介绍自己的名字",
      "prompt": "团团想介绍自己，我们一起听听名字是怎么问、怎么说的。",
      "recommendedMinutes": 15,
      "vocabularyIds": [
        "wj-g3-v1:welcome:be",
        "wj-g3-v1:welcome:what",
        "wj-g3-v1:welcome:your",
        "wj-g3-v1:welcome:my"
      ],
      "sentenceIds": [
        "wj-g3-v1:welcome:sentence-whats-your-name",
        "wj-g3-v1:welcome:sentence-my-name-is",
        "wj-g3-v1:welcome:sentence-im"
      ],
      "objectiveIdsToComplete": [
        "introduce-self"
      ]
    },
    {
      "id": "welcome-session-03",
      "taskId": "wj-g3-v1:welcome:task-morning-greetings",
      "title": "第3课：认识新朋友",
      "prompt": "早晨啦！我们陪团团向新朋友问好，认识课本里的伙伴。",
      "recommendedMinutes": 15,
      "vocabularyIds": [
        "wj-g3-v1:welcome:good",
        "wj-g3-v1:welcome:morning",
        "wj-g3-v1:welcome:ms"
      ],
      "sentenceIds": [
        "wj-g3-v1:welcome:sentence-good-morning",
        "wj-g3-v1:welcome:sentence-meet-your-new-friends"
      ],
      "objectiveIdsToComplete": [
        "greet-in-context"
      ]
    },
    {
      "id": "welcome-session-04",
      "taskId": "wj-g3-v1:welcome:task-farewell",
      "title": "第4课：友好地说再见",
      "prompt": "故事要暂时告一段落，我们学着和朋友好好道别。",
      "recommendedMinutes": 15,
      "vocabularyIds": [
        "wj-g3-v1:welcome:goodbye",
        "wj-g3-v1:welcome:have",
        "wj-g3-v1:welcome:a-an",
        "wj-g3-v1:welcome:nice",
        "wj-g3-v1:welcome:day"
      ],
      "sentenceIds": [
        "wj-g3-v1:welcome:sentence-goodbye",
        "wj-g3-v1:welcome:sentence-have-a-nice-day"
      ],
      "objectiveIdsToComplete": [
        "farewell"
      ]
    },
    {
      "id": "welcome-session-05",
      "taskId": "wj-g3-v1:welcome:task-classroom-actions-one",
      "title": "第5课：听一听，做一做",
      "prompt": "我们跟着团团听指令、指一指，再试着说出来。",
      "recommendedMinutes": 15,
      "vocabularyIds": [
        "wj-g3-v1:welcome:point",
        "wj-g3-v1:welcome:say",
        "wj-g3-v1:welcome:listen"
      ],
      "sentenceIds": [
        "wj-g3-v1:welcome:sentence-look-and-listen",
        "wj-g3-v1:welcome:sentence-point-and-say",
        "wj-g3-v1:welcome:sentence-point",
        "wj-g3-v1:welcome:sentence-say",
        "wj-g3-v1:welcome:sentence-listen",
        "wj-g3-v1:welcome:sentence-listen-point-say"
      ],
      "objectiveIdsToComplete": []
    },
    {
      "id": "welcome-session-06",
      "taskId": "wj-g3-v1:welcome:task-classroom-actions-two",
      "title": "第6课：教室里的小指令",
      "prompt": "团团找到了书本，我们一起听懂站起来、坐下和打开书本的指令。",
      "recommendedMinutes": 15,
      "vocabularyIds": [
        "wj-g3-v1:welcome:stand",
        "wj-g3-v1:welcome:stand-up",
        "wj-g3-v1:welcome:sit",
        "wj-g3-v1:welcome:sit-down",
        "wj-g3-v1:welcome:open",
        "wj-g3-v1:welcome:book",
        "wj-g3-v1:welcome:close",
        "wj-g3-v1:welcome:read",
        "wj-g3-v1:welcome:write"
      ],
      "sentenceIds": [
        "wj-g3-v1:welcome:sentence-stand-up",
        "wj-g3-v1:welcome:sentence-open-your-book",
        "wj-g3-v1:welcome:sentence-close-your-book",
        "wj-g3-v1:welcome:sentence-sit-down",
        "wj-g3-v1:welcome:sentence-read",
        "wj-g3-v1:welcome:sentence-write"
      ],
      "objectiveIdsToComplete": [
        "understand-learning-actions"
      ]
    },
    {
      "id": "welcome-session-07",
      "taskId": "wj-g3-v1:welcome:task-letter-recognition",
      "title": "第7课：字母探险",
      "prompt": "跟着团团看看、听听并找出大小写字母朋友。",
      "recommendedMinutes": 15,
      "vocabularyIds": [],
      "sentenceIds": [],
      "alphabetLetters": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z"
      ],
      "objectiveIdsToComplete": [
        "recognize-letters"
      ]
    }
  ],
  "reviewStatus": "pending_human_review",
  "releaseStatus": "development_preview_only",
  "editorialNote": "Welcome 是完整课程单元，全部27个词条与21条句型均保留在知识库。7节约15分钟的递进课程分批释放内容；全部5项目标完成前，Unit 1 保持锁定。释义与活动顺序仍待教学审核。"
};
