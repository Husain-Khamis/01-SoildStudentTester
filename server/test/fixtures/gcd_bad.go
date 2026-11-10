package piscine

func Gcd(a, b uint) uint {
	for b != 0 {
		a, b = b, a%b
	}
	return a + 1
}
