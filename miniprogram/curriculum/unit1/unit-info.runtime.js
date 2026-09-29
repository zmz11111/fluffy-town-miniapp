// 由 unit-info.json 同步生成，字段和值保持一致。
module.exports = {
  "schemaVersion": "0.2-draft",
  "id": "wj-g3-v1:unit-1",
  "reviewStatus": "pending_human_review",
  "releaseStatus": "not_for_runtime",
  "textbook": {
    "id": "wj-g3-v1",
    "subject": "英语",
    "grade": 3,
    "volume": "上册",
    "publisherSeries": "外研版新标准（三年级起点）",
    "editionDetails": "待人工核对封面和版权页",
    "sources": [
      {
        "documentId": "student-book",
        "pdfPage": 2,
        "printedPage": null,
        "locator": "书名页；年级、册别及主编",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "teacher-book",
        "pdfPage": 9,
        "printedPage": 5,
        "locator": "Unit 1 单元整体分析标题",
        "sourceFile": "新标准外研版三上教师用书.pdf",
        "sourcePositionCheck": "visually_cross_checked"
      }
    ],
    "sourceDocuments": [
      {
        "id": "student-book",
        "fileName": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "extraction": "text-and-visual",
        "rightsStatus": "pending_rights_review",
        "reviewStatus": "pending_human_review"
      },
      {
        "id": "teacher-book",
        "fileName": "新标准外研版三上教师用书.pdf",
        "extraction": "visual-review-scanned-pages",
        "rightsStatus": "pending_rights_review",
        "reviewStatus": "pending_human_review"
      },
      {
        "id": "word-list",
        "fileName": "三上外研版三起点英语【单词表】.pdf",
        "extraction": "text-and-visual",
        "rightsStatus": "pending_rights_review",
        "reviewStatus": "pending_human_review"
      }
    ],
    "reviewStatus": "pending_human_review"
  },
  "position": {
    "sequence": [
      "Welcome",
      "Unit 1",
      "Unit 2",
      "Unit 3",
      "Unit 4",
      "Unit 5",
      "Unit 6",
      "Appendices"
    ],
    "wordListCoverage": [
      "Welcome",
      "Unit 1",
      "Unit 2",
      "Unit 3",
      "Unit 4",
      "Unit 5",
      "Unit 6"
    ],
    "wordListHasAppendices": false,
    "sources": [
      {
        "documentId": "student-book",
        "pdfPage": 6,
        "printedPage": null,
        "locator": "Contents：Welcome、Unit 1–6、Appendices",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "word-list",
        "pdfPage": 1,
        "printedPage": null,
        "locator": "Welcome 页标题",
        "sourceFile": "三上外研版三起点英语【单词表】.pdf",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "word-list",
        "pdfPage": 7,
        "printedPage": null,
        "locator": "Unit 6 页标题；文件末页",
        "sourceFile": "三上外研版三起点英语【单词表】.pdf",
        "sourcePositionCheck": "visually_cross_checked"
      }
    ],
    "reviewStatus": "pending_human_review"
  },
  "unit": {
    "number": 1,
    "title": "Let’s be friends!",
    "topic": "结识新朋友、介绍自己和朋友、互相帮助",
    "difficulty": null,
    "studentBookPrintedPages": {
      "start": 6,
      "end": 17
    },
    "studentBookPdfPages": {
      "start": 11,
      "end": 22
    },
    "teacherBookPrintedPages": {
      "start": 5,
      "end": 26
    },
    "teacherBookPdfPages": {
      "start": 9,
      "end": 30
    },
    "sections": [
      "Get ready",
      "Start up",
      "In focus",
      "Speed up",
      "Fuel up",
      "Hit it big",
      "Wrap up",
      "Let’s explore"
    ],
    "sources": [
      {
        "documentId": "student-book",
        "pdfPage": 6,
        "printedPage": null,
        "locator": "Contents：Unit 1 Let’s be friends! 6；Unit 2 18",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "pdfPage": 11,
        "printedPage": 6,
        "locator": "Unit 1 标题",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "teacher-book",
        "pdfPage": 9,
        "printedPage": 5,
        "locator": "单元主题和主题意义",
        "sourceFile": "新标准外研版三上教师用书.pdf",
        "sourcePositionCheck": "visually_cross_checked"
      }
    ],
    "reviewStatus": "pending_human_review"
  },
  "importScope": {
    "included": "仅 Unit 1 的教材结构、单词表词条、句型候选和教学目标；均待人工审校",
    "excluded": [
      "Welcome 词条不并入 Unit 1 词汇清单",
      "Appendices 不作为本次单词来源",
      "现有模拟教材词条不作为真实教材证据",
      "不导入 PDF 原件、图片、音频或教材长段课文"
    ],
    "prerequisiteWelcomeWords": [
      "hello",
      "hi",
      "name"
    ],
    "notes": [
      "Unit 1 课文仍使用 hello、hi；它们在本单词表归属 Welcome。",
      "官方材料未给出统一的 1–5 难度级别，因此 difficulty 暂为 null。"
    ],
    "sources": [
      {
        "documentId": "word-list",
        "pdfPage": 1,
        "printedPage": null,
        "locator": "Welcome 词表：hello、hi、name",
        "sourceFile": "三上外研版三起点英语【单词表】.pdf",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "word-list",
        "pdfPage": 2,
        "printedPage": null,
        "locator": "Unit 1 词表",
        "sourceFile": "三上外研版三起点英语【单词表】.pdf",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "pdfPage": 21,
        "printedPage": 16,
        "locator": "Wrap up：Hello、Hi",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "sourcePositionCheck": "visually_cross_checked"
      }
    ],
    "reviewStatus": "pending_human_review"
  },
  "sourceDocuments": [
    {
      "id": "student-book",
      "fileName": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
      "extraction": "text-and-visual",
      "rightsStatus": "pending_rights_review",
      "reviewStatus": "pending_human_review"
    },
    {
      "id": "teacher-book",
      "fileName": "新标准外研版三上教师用书.pdf",
      "extraction": "visual-review-scanned-pages",
      "rightsStatus": "pending_rights_review",
      "reviewStatus": "pending_human_review"
    },
    {
      "id": "word-list",
      "fileName": "三上外研版三起点英语【单词表】.pdf",
      "extraction": "text-and-visual",
      "rightsStatus": "pending_rights_review",
      "reviewStatus": "pending_human_review"
    }
  ],
  "importValidation": {
    "method": "用提供的 PDF 渲染相关页面并与候选条目逐项交叉核对",
    "sourcePositionStatus": "checked",
    "contentReviewStatus": "pending_human_review",
    "checkedPages": [
      {
        "documentId": "word-list",
        "sourceFile": "三上外研版三起点英语【单词表】.pdf",
        "pdfPage": 1,
        "printedPage": null,
        "locator": "Welcome 词表；hello、hi、name 先修词",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "word-list",
        "sourceFile": "三上外研版三起点英语【单词表】.pdf",
        "pdfPage": 2,
        "printedPage": null,
        "locator": "Unit 1 单词表；40 个词条，左右栏逐行核对",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "word-list",
        "sourceFile": "三上外研版三起点英语【单词表】.pdf",
        "pdfPage": 7,
        "printedPage": null,
        "locator": "Unit 6 词表；文件末页",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "pdfPage": 6,
        "printedPage": null,
        "locator": "目录；Welcome、Unit 1–6、Appendices",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "pdfPage": 11,
        "printedPage": 6,
        "locator": "Unit 1 标题及 Get ready",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "pdfPage": 13,
        "printedPage": 8,
        "locator": "Start up 人物对白",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "pdfPage": 14,
        "printedPage": 9,
        "locator": "In focus 人物介绍",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "pdfPage": 15,
        "printedPage": 10,
        "locator": "Speed up 互助及礼貌用语",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "pdfPage": 16,
        "printedPage": 11,
        "locator": "Speed up 一起玩及朋友写画活动",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "pdfPage": 18,
        "printedPage": 13,
        "locator": "Fuel up 朋友介绍",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "pdfPage": 19,
        "printedPage": 14,
        "locator": "Hit it big 朋友海报",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "student-book",
        "sourceFile": "英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
        "pdfPage": 21,
        "printedPage": 16,
        "locator": "Wrap up 自评清单",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "teacher-book",
        "sourceFile": "新标准外研版三上教师用书.pdf",
        "pdfPage": 9,
        "printedPage": 5,
        "locator": "Unit 1 单元整体分析和主题意义",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "teacher-book",
        "sourceFile": "新标准外研版三上教师用书.pdf",
        "pdfPage": 12,
        "printedPage": 8,
        "locator": "单元教学目标",
        "sourcePositionCheck": "visually_cross_checked"
      },
      {
        "documentId": "teacher-book",
        "sourceFile": "新标准外研版三上教师用书.pdf",
        "pdfPage": 16,
        "printedPage": 12,
        "locator": "In focus 教学指导和缩写提示",
        "sourcePositionCheck": "visually_cross_checked"
      }
    ],
    "findings": [
      "单词表 Unit 1 共 40 项；同形词 here 的“在这里”和“给你”保留为两个独立义项。",
      "单词表从 Welcome 延续至 Unit 6，末页为 Unit 6；学生用书目录中的 Appendices 不作为单词表词源。",
      "Welcome 中的 hello、hi、name 单独保留为先修词，不并入 Unit 1 词表。",
      "学生用书句型位置和教师用书四项目标在候选来源页可对应；教师用书易错点仍是教学提示，不视为真实学生错误。",
      "thank 的中文标点按单词表页面规范为中文逗号；其余候选译义保留待英语教师终审。"
    ],
    "limitations": [
      "版次与版权页信息尚未由负责人最终确认，资料发布授权仍待核实。",
      "该核验确认来源位置和候选转录可追溯，不替代英语、教学、版权和儿童适龄性人工审核。"
    ]
  }
};
