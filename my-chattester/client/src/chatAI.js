const { OpenAI } = require('openai');
const { getConfiguration } = require('./utils');

async function deepseek(prompt, apiKey = null) {
    const config = apiKey || getConfiguration().apiKey;
    
    const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        //暂时apikey直接用
        apiKey: 'sk-b9eb2e862b504e65b8b466c8574aee50'
    });

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ 
                role: "user", 
                content: prompt 
            }],
            model: "deepseek-chat",
            temperature: 0.3  // 降低随机性
        });
        
        return completion.choices[0].message.content;
    } catch (error) {
        throw new Error(`AI请求失败: ${error.message}`);
    }
}

module.exports = {
    deepseek
};