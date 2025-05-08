# GetContext.py
# -*- coding: utf-8 -*-
import ast
import sys
import io
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class FunctionContextExtractorFromFile:
    def __init__(self, file_path, target_function_name):
        self.file_path = file_path
        self.target_function_name = target_function_name
        self.source_code = ""
        self.ast_tree = None
        self.target_function_node = None
        self.context = {
            'imports': [],
            'globals': [],
            'class_definitions': {},
            'function_definitions': {},
            'target_function': None,
            'dependencies': []
        }

    def load_source(self):
        with open(self.file_path, 'r', encoding='utf-8') as f:
            self.source_code = f.read()
        self.ast_tree = ast.parse(self.source_code)

    def find_target_function(self):
        for node in ast.walk(self.ast_tree):
            if isinstance(node, ast.FunctionDef) and node.name == self.target_function_name:
                self.target_function_node = node
                break

    def extract_imports(self):
        for node in ast.walk(self.ast_tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                self.context['imports'].append(ast.unparse(node))

    def extract_globals(self):
        for node in self.ast_tree.body:
            if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
                self.context['globals'].append({
                    'name': node.targets[0].id,
                    'value': ast.unparse(node.value)
                })

    def extract_class_and_function_definitions(self):
        for node in self.ast_tree.body:
            if isinstance(node, ast.ClassDef):
                methods = {}
                for item in node.body:
                    if isinstance(item, ast.FunctionDef):
                        methods[item.name] = ast.unparse(item)
                self.context['class_definitions'][node.name] = {
                    'signature': ast.unparse(node),
                    'methods': methods
                }
            elif isinstance(node, ast.FunctionDef):
                self.context['function_definitions'][node.name] = ast.unparse(node)

    def analyze_dependencies(self):
        if self.target_function_node is None:
            return
        for node in ast.walk(self.target_function_node):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    self.context['dependencies'].append(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    self.context['dependencies'].append(node.func.attr)

    def get_type_context(self):
        if self.target_function_node is None:
            return {}
        parameters = []
        for arg in self.target_function_node.args.args:
            param_info = {
                'name': arg.arg,
                'type': ast.unparse(arg.annotation) if arg.annotation else 'Any',
                'default': None
            }
            parameters.append(param_info)
        return_type = ast.unparse(self.target_function_node.returns) if self.target_function_node.returns else 'Any'

        return {
            'function_name': self.target_function_node.name,
            'parameters': parameters,
            'return_type': return_type
        }

    def build_context(self):
        self.load_source()
        self.find_target_function()
        self.extract_imports()
        self.extract_globals()
        self.extract_class_and_function_definitions()
        self.analyze_dependencies()

        function_def_str = ast.unparse(self.target_function_node) if self.target_function_node else ''

        return {
            'type_context': self.get_type_context(),
            'dependency_context': {
                'imports': self.context['imports'],
                'globals': self.context['globals'],
                'dependencies': self.context['dependencies']
            },
            'class_context': {},  # 可拓展：查找所属类
            'function_definition': function_def_str,
            'related_definitions': {
                'classes': self.context['class_definitions'],
                'functions': self.context['function_definitions']
            }
        }


def format_context(context):
    output = []

    type_ctx = context['type_context']
    output.append("=== 函数基本信息 ===")
    output.append(f"函数名称: {type_ctx.get('function_name', '')}")
    output.append(f"返回类型: {type_ctx.get('return_type', 'Any')}")
    output.append("\n参数列表:")
    for param in type_ctx.get('parameters', []):
        param_str = f"- {param['name']}: {param['type']}"
        output.append(param_str)

    dep_ctx = context['dependency_context']
    output.append("\n=== 依赖信息 ===")
    output.append("\n导入语句:")
    for imp in dep_ctx['imports']:
        output.append(f"- {imp}")

    output.append("\n全局变量:")
    for global_var in dep_ctx['globals']:
        output.append(f"- {global_var['name']}: {global_var['value']}")

    output.append("\n依赖的函数/方法:")
    for dep in dep_ctx['dependencies']:
        output.append(f"- {dep}")

    output.append("\n=== 相关定义 ===")
    output.append("\n其他类定义:")
    for class_name, class_def in context['related_definitions']['classes'].items():
        output.append(f"\n类 {class_name}:\n{class_def['signature']}")

    output.append("\n其他函数定义:")
    for func_name, func_def in context['related_definitions']['functions'].items():
        output.append(f"\n函数 {func_name}:\n{func_def}")

    output.append("\n=== 完整函数定义 ===")
    output.append(context['function_definition'])

    return "\n".join(output)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python GetContext.py <file_path> <target_function>")
        sys.exit(1)

    file_path = sys.argv[1]
    target_function_name = sys.argv[2]

    extractor = FunctionContextExtractorFromFile(file_path, target_function_name)
    context = extractor.build_context()
    formatted = format_context(context)
    print(formatted)
