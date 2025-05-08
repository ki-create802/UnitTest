/**
 * 数学运算工具类，提供常见的数学计算方法
 */
public class MathUtils {

    // 常量：圆周率π
    public static final double PI = 3.141592653589793;

    // 常量：自然对数的底数e
    public static final double E = 2.718281828459045;

    /**
     * 计算两个整数的和
     * 
     * @param a 第一个数
     * @param b 第二个数
     * @return a + b 的结果
     */
    public static int add(int a, int b) {
        return a + b;
    }

    /**
     * 计算两个浮点数的和
     * 
     * @param a 第一个数
     * @param b 第二个数
     * @return a + b 的结果
     */
    public static double add(double a, double b) {
        return a + b;
    }

    /**
     * 计算两个整数的差
     * 
     * @param a 被减数
     * @param b 减数
     * @return a - b 的结果
     */
    public static int subtract(int a, int b) {
        return a - b;
    }

    /**
     * 计算两个浮点数的差
     * 
     * @param a 被减数
     * @param b 减数
     * @return a - b 的结果
     */
    public static double subtract(double a, double b) {
        return a - b;
    }

    /**
     * 计算两个整数的乘积
     * 
     * @param a 第一个数
     * @param b 第二个数
     * @return a * b 的结果
     */
    public static int multiply(int a, int b) {
        return a * b;
    }

    /**
     * 计算两个浮点数的乘积
     * 
     * @param a 第一个数
     * @param b 第二个数
     * @return a * b 的结果
     */
    public static double multiply(double a, double b) {
        return a * b;
    }

    /**
     * 计算两个整数的除法（返回浮点数）
     * 
     * @param a 被除数
     * @param b 除数（不能为0）
     * @return a / b 的结果（double）
     * @throws ArithmeticException 如果除数为0
     */
    public static double divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("除数不能为0");
        }
        return (double) a / b;
    }

    /**
     * 计算两个浮点数的除法
     * 
     * @param a 被除数
     * @param b 除数（不能为0）
     * @return a / b 的结果
     * @throws ArithmeticException 如果除数为0
     */
    public static double divide(double a, double b) {
        if (b == 0.0) {
            throw new ArithmeticException("除数不能为0");
        }
        return a / b;
    }

    /**
     * 计算一个数的绝对值
     * 
     * @param num 输入的数字
     * @return 绝对值
     */
    public static int abs(int num) {
        return num < 0 ? -num : num;
    }

    /**
     * 计算一个浮点数的绝对值
     * 
     * @param num 输入的数字
     * @return 绝对值
     */
    public static double abs(double num) {
        return num < 0 ? -num : num;
    }

    /**
     * 计算一个数的平方
     * 
     * @param num 输入的数字
     * @return num²
     */
    public static int square(int num) {
        return num * num;
    }

    /**
     * 计算一个浮点数的平方
     * 
     * @param num 输入的数字
     * @return num²
     */
    public static double square(double num) {
        return num * num;
    }

    /**
     * 计算一个数的立方
     * 
     * @param num 输入的数字
     * @return num³
     */
    public static int cube(int num) {
        return num * num * num;
    }

    /**
     * 计算一个浮点数的立方
     * 
     * @param num 输入的数字
     * @return num³
     */
    public static double cube(double num) {
        return num * num * num;
    }

    /**
     * 计算一个数的阶乘（n!）
     * 
     * @param n 非负整数
     * @return n! 的结果
     * @throws IllegalArgumentException 如果 n < 0
     */
    public static long factorial(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("阶乘不能计算负数");
        }
        if (n == 0 || n == 1) {
            return 1;
        }
        long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    /**
     * 计算两个数的最大值
     * 
     * @param a 第一个数
     * @param b 第二个数
     * @return 较大的数
     */
    public static int max(int a, int b) {
        return a > b ? a : b;
    }

    /**
     * 计算两个浮点数的最大值
     * 
     * @param a 第一个数
     * @param b 第二个数
     * @return 较大的数
     */
    public static double max(double a, double b) {
        return a > b ? a : b;
    }

    /**
     * 计算两个数的最小值
     * 
     * @param a 第一个数
     * @param b 第二个数
     * @return 较小的数
     */
    public static int min(int a, int b) {
        return a < b ? a : b;
    }

    /**
     * 计算两个浮点数的最小值
     * 
     * @param a 第一个数
     * @param b 第二个数
     * @return 较小的数
     */
    public static double min(double a, double b) {
        return a < b ? a : b;
    }

    /**
     * 判断一个数是否是偶数
     * 
     * @param num 输入的数字
     * @return true 如果是偶数，否则 false
     */
    public static boolean isEven(int num) {
        return num % 2 == 0;
    }

    /**
     * 判断一个数是否是素数（质数）
     * 
     * @param num 输入的数字（>=2）
     * @return true 如果是素数，否则 false
     * @throws IllegalArgumentException 如果 num < 2
     */
    public static boolean isPrime(int num) {
        if (num < 2) {
            throw new IllegalArgumentException("素数必须 >= 2");
        }
        for (int i = 2; i <= Math.sqrt(num); i++) {
            if (num % i == 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * 主方法，用于测试
     */
    public static void main(String[] args) {
        System.out.println("5 + 3 = " + add(5, 3));
        System.out.println("10 / 3 = " + divide(10, 3));
        System.out.println("7! = " + factorial(7));
        System.out.println("Is 13 prime? " + isPrime(13));
    }
}