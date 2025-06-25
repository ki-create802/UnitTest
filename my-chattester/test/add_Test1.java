import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

public class add_test1_Test {

    @Test
    public void testAddPositiveNumbers() {
        int result = MathUtils.add(5, 3);
        assertEquals(8, result);
    }

    @Test
    public void testAddNegativeNumbers() {
        int result = MathUtils.add(-5, -3);
        assertEquals(-8, result);
    }

    @Test
    public void testAddZero() {
        int result = MathUtils.add(0, 0);
        assertEquals(0, result);
    }
}