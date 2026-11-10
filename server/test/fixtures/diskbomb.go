package main

import (
	"fmt"
	"os"
)

func main() {
	for _, dir := range []string{"/jail", "/tmp", "/go", "/"} {
		f, err := os.Create(dir + "/big")
		if err != nil {
			fmt.Println(dir, "create:", err)
			continue
		}
		buf := make([]byte, 8<<20)
		n := 0
		for ; n < 512; n++ {
			if _, err := f.Write(buf); err != nil {
				fmt.Println(dir, "stopped at", n*8, "MB:", err)
				break
			}
		}
		f.Close()
		os.Remove(dir + "/big")
	}
	fmt.Println("id", os.Getuid())
}
