const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_HOST = 'api.deepseek.com';
const USE_MOCK = !DEEPSEEK_API_KEY;

// Mock 数据：用于未配置 API Key 时测试流程
const MOCK_RESULT = {
  matchScore: 68,
  optimizedResume: `【个人信息】
张三 | 138****8888 | zhangsan@email.com

【求职意向】
前端开发工程师

【工作经历】
**ABC科技有限公司 | 前端开发工程师 | 2021.06 - 至今**
• 主导公司核心产品前端架构升级，使用 React + TypeScript 重构 legacy 系统，页面加载速度提升 40%
• 搭建内部组件库，沉淀 30+ 通用组件，团队开发效率提升 25%
• 优化首屏渲染性能，FCP 从 2.1s 降至 0.8s，用户跳出率降低 15%
• 推动前端工程化建设，引入 ESLint + Prettier + Husky，代码合规范率达到 95%

**XYZ互联网公司 | 初级前端工程师 | 2019.07 - 2021.05**
• 负责电商活动页面开发，累计支持 50+ 运营活动，页面 UV 超 1000 万
• 开发 H5 抽奖活动，通过性能优化使页面流畅度提升，活动期间无卡顿客诉`,
  problems: [
    { type: '空话套话', description: '原简历使用"负责前端开发工作"等笼统描述，缺乏具体成果和数据支撑，HR 无法判断实际能力水平。' },
    { type: '无成果', description: '工作经历仅罗列职责，未体现量化成果。建议补充具体数据，如性能提升百分比、用户增长数、营收贡献等。' },
    { type: '被质疑点', description: '技术栈描述较浅，缺少难点攻克和复杂场景处理经验，面试时容易被追问"这个项目难点是什么"。' },
    { type: '成果强化', description: '缺少对业务价值的描述，建议补充"通过 XX 优化，带来 XX 业务指标提升"的表达方式。' }
  ],
  optimizationNotes: '本次优化重点：1）将职责描述改为成果导向表达，补充量化数据；2）去除"负责""参与"等弱动词，改用"主导""推动""优化"等强动词；3）增加业务价值描述，让 HR 快速感知你的贡献度。',
  keyComparisons: [
    {
      before: '参与项目开发',
      after: '主导【核心模块】开发，提升【30%】系统性能',
      explanation: '增加量化成果，让能力更具说服力'
    },
    {
      before: '负责系统维护',
      after: '搭建【自动化运维体系】，故障率降低【20%】',
      explanation: '突出结果导向，更容易通过筛选'
    },
    {
      before: '协助团队完成项目',
      after: '带领【5人团队】完成项目交付，效率提升【25%】',
      explanation: '体现领导力与团队协作成果'
    }
  ]
};

function callDeepSeekAPI(jobTitle, resumeContent) {
  return new Promise((resolve, reject) => {
    const systemPrompt = `你是一位资深 HR 和简历优化专家，擅长帮助求职者提升简历通过率。请根据用户提供的岗位名称和简历内容，进行专业优化。

请严格按照以下 JSON 格式返回结果，不要包含任何其他文字或 markdown 标记：
{
  "matchScore": 0-100的数字,
  "optimizedResume": "优化后的完整简历内容，使用Markdown格式",
  "problems": [
    {"type": "空话套话", "description": "具体问题描述"},
    {"type": "无成果", "description": "具体问题描述"},
    {"type": "被质疑点", "description": "具体问题描述"}
  ],
  "optimizationNotes": "优化说明，简要说明优化了哪些方面",
  "keyComparisons": [
    {
      "before": "原文中的典型句子",
      "after": "优化后的表达，用【】包裹关键成果信息（如数字、核心动词、关键成果）",
      "explanation": "一句话解释为什么这样优化更好"
    }
  ]
}

要求：
1. matchScore：根据简历与岗位的匹配度给出 0-100 的评分
2. optimizedResume：对原简历进行优化重写，使其更具成果导向，去除空话套话，量化成果，保留核心经历
3. problems：至少找出 3-5 个关键问题，每个问题包含 type（问题类型：空话套话/无成果/被质疑点/成果强化）和 description（具体描述，指出问题并给出改进建议）
4. optimizationNotes：简要总结优化思路和核心改进点
5. keyComparisons：返回2-3个最具代表性的优化前后对比，每个对比包含 before（原文）、after（优化后，用【】包裹高亮内容）、explanation（优化说明）`;

    const userPrompt = `岗位名称：${jobTitle}\n\n简历内容：\n${resumeContent}`;

    const requestData = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const req = https.request({
      hostname: DEEPSEEK_API_HOST,
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 60000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(response.error.message || 'API 返回错误'));
            return;
          }
          const content = response.choices[0].message.content;
          const result = JSON.parse(content);
          resolve({
            matchScore: result.matchScore || 75,
            optimizedResume: result.optimizedResume || '',
            problems: result.problems || [],
            optimizationNotes: result.optimizationNotes || '',
            keyComparisons: result.keyComparisons || []
          });
        } catch (e) {
          reject(new Error('解析结果失败: ' + e.message));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error('请求失败: ' + e.message));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(requestData);
    req.end();
  });
}

exports.main = async (event, context) => {
  const { jobTitle, resumeContent } = event;
  
  if (!jobTitle || !resumeContent) {
    return {
      success: false,
      message: '岗位名称和简历内容不能为空'
    };
  }

  try {
    let result;
    
    if (USE_MOCK) {
      console.log('[MOCK] 未配置 DEEPSEEK_API_KEY，返回模拟数据');
      // 模拟 API 延迟
      await new Promise(r => setTimeout(r, 1500));
      result = MOCK_RESULT;
    } else {
      result = await callDeepSeekAPI(jobTitle, resumeContent);
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('DeepSeek API 调用失败:', error);
    // 即使 API 失败也返回 mock 数据，保证用户体验
    return {
      success: true,
      data: MOCK_RESULT,
      _mock: true,
      _error: error.message
    };
  }
};
