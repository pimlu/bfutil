# namefuck.js
###### Utilities that make Brainfuck programming easier

This is a set of utilities that make programming in Brainfuck easier.  Most of the code was put together in a few hours for the sake of [this presentation](https://goo.gl/8Ok435), so it isn't pretty.

Try it out [here](https://pimlu.github.io/bfutil/).

See the presentation I made it for [here](https://goo.gl/8Ok435).

Here's an example program it can process:

```
;initialize variables
@setn(i, 26)
@setc(letter, a)
@setc(LETTER, A)
@setn(even, 1)

;while we have letters to print
@whi(i)
  ;print lower case if even, else upper
  @if(even)
    even-
    letter.
  @else
    even+
    LETTER.
  @end

  ;increment our chars, decrement number of letters left
  letter+
  LETTER+
  i-
@end
```

The Brainfuck program it generates will output `aBcDeFgHiJkLmNoPqRsTuVwXyZ`.  As you can see, you don't really need to know Brainfuck that well to use it.