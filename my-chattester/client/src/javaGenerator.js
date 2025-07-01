const vscode = require('vscode');
const path = require('path');
const { parseJavaFile } = require('./fileParser');
const { deepseek } = require('./chatAI');
const { getConfiguration } = require('./utils');
const { writeTestFiles } = require('./write-to-file');
const { processGeneratedTestFiles } = require('./javafile-compile');

function getAIInfo() {
    return {
      "ai": "DeepSeek Chat",  // 我使用的AI模型
      "apikey": "这里需填写你的apikey",  // 请在此处填写您的API密钥
    //   "jar包": "相关配置",  // 相关配置信息
    //   "方法名": "请输入"  // 生成的测试代码语言
    };
}
  

async function generateTest(filePath, selectedText,userQuestion,Back_require) {
    // 简单提取方法名
	const methodNameMatch = selectedText.match(/(?:public|private|protected)?\s+\w[\w<>\[\]]*\s+(\w+)\s*\(.*?\)/);
	const targetMethod = methodNameMatch ? methodNameMatch[1] : 'UnknownMethod';     //用到的是原版本的签名
    const TestOutputPrompt=`
        Please generate multiple Java test files in a pure JSON-formatted string. These test files are stored in a 'List'. The output JSON string contains a 'tests' object, which is a list. Each element in the list represents a Java test file, and there should be no other responses.

        It should be noted that the class name of each generated test class should follow the format "${targetMethod}_" + "test" + "i" + "_Test", where "i" indicates that this is the i-th file. Do not include any Markdown code block identifiers.
        ***output example***
        {
            "tests":[
            "import static org.junit.jupiter.api.Assertions.assertEquals;  // JUnit 5 的正确注解
            import org.junit.jupiter.api.Test;  // JUnit 5 的断言

        public class MathUtils_test1_Test {

            @Test
            public void testDivideIntNormalCase() {
                double result = MathUtils.divide(10, 2);
                assertEquals(5.0, result, 0.0001);
            }

            @Test
            public void testDivideIntFractionalResult() {
                double result = MathUtils.divide(5, 2);
                assertEquals(2.5, result, 0.0001);
            }

            @Test(expected = ArithmeticException.class)
            public void testDivideIntByZero() {
                MathUtils.divide(10, 0);
            }

            @Test
            public void testDivideIntNegativeNumbers() {
                double result = MathUtils.divide(-10, 2);
                assertEquals(-5.0, result, 0.0001);
            }

            @Test
            public void testDivideIntZeroNumerator() {
                double result = MathUtils.divide(0, 5);
                assertEquals(0.0, result, 0.0001);
            }
        }
        ",
            ]
        }
        `

    // 获取配置
    const config = getConfiguration();
    
    // 解析Java文件获取上下文信息
    // console.log(`\n===== Getting Focal method Info: ${targetMethod} =====`);
    const classInfo = await parseJavaFile(filePath, targetMethod);
    console.log(classInfo);
    // console.log(`\n===================================================\n`)
    
    // 生成方法意图
    // console.log(`\n===== Generating Focal method Intention: ${targetMethod} =====`);
    const NL_intention=`\n\nplease infer the intention of the facol method ${targetMethod}. You only need to reply with what the intention of the focal method is, without any other content.`;
    const intentionPrompt = classInfo + NL_intention;
    const intention = await deepseek(intentionPrompt, config.apiKey);
    // console.log(intention);
    // console.log(`\n===================================================\n`)

    // 生成测试代码
    // console.log(`\n===== Generating Focal method Test: ${targetMethod} =====`);
    const NL_test=`The Intention of "${targetMethod}" is ${intention}.\nYou are a professional who writes Java test methods.Please write a test method for the "${targetMethod}" with the given Method Intention.`+TestOutputPrompt+userQuestion;
    const TestPrompt = classInfo + NL_test;
    // console.log(`===============最终提示词============\n${NL_test}\n\n`)
    const test = await deepseek(TestPrompt, config.apiKey);
    // console.log(test);
    // console.log(`\n===================================================\n`)

    const cleanedJson = test.replace(/```json|```/g, '').trim();
    const { tests = [] } = JSON.parse(cleanedJson);


    // 保存测试文件
    const testFiles = await writeTestFiles(
        test, 
        targetMethod, 
        filePath
    );

    // 自动打开第一个测试文件
    // if (testFiles.length > 0) {
    //     const doc = await vscode.workspace.openTextDocument(testFiles[0]);
    //     vscode.window.showTextDocument(doc);
    // }

    // 在测试生成后自动运行
    //await processGeneratedTestFiles(path.join(path.dirname(filePath), 'generated_tests'));
    
    return tests;

}

module.exports = {
    generateTest,
    getAIInfo

};