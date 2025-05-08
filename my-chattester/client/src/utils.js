const vscode = require('vscode');

function getConfiguration() {
    const config = vscode.workspace.getConfiguration('javaTestGen');
    return {
        apiKey: config.get('apiKey'),
        testFramework: config.get('testFramework', 'JUnit5')
    };
}

async function showResultWithCopyOption(message) {
    const action = await vscode.window.showInformationMessage(
        message, 
        'Copy', 'Open File'
    );
    
    if (action === 'Copy') {
        vscode.env.clipboard.writeText(message);
    }
    return action;
}

module.exports = {
    getConfiguration,
    showResultWithCopyOption
};