import { parseComps, isComputedProp, potRawCompProp, parseComputedProp, parseViews } from "./Parser";
/**
 * {{}} (double bracers) means everything inside will be executed as JavaScript in context with variables refering to the properties in the current component
 * 
 * Additionally, there is a variable called context, which contains the current event information, parent component information and etc which the user can write to access this information 
 * {{context[x]}} => context[context[x]]
 * 
 * 
 * 
 * 
   {{context[`${x}${y}`]] + 1}} => context[`${x}${y}`] + 1
 * "{{x}}"" means that it will be of whatever type x is (number, string, etc)
 * "{{`${x}`}}" means it will be a string

 */


/**
 * Tests for isCompProp function
 */

test('isComputedProp TC1', () => {
  expect(isComputedProp("{{x}}")).toBe(true);
});

test('isComputedProp TC2', () => {
  expect(isComputedProp("Test {{`${x}`}}")).toBe(true);
});

test('isComputedProp TC3', () => {
  expect(isComputedProp("Test")).toBe(false);
});

test('isComputedProp TC4', () => {
  expect(isComputedProp("{{`${x}`}")).toBe(false);
});

test('isComputedProp TC5', () => {
  expect(isComputedProp("{`${x}`}}")).toBe(false);
});

test('isComputedProp TC6', () => {
  expect(isComputedProp("{`${x}`}")).toBe(false);
});

test('isComputedProp TC7', () => {
  expect(isComputedProp(1)).toBe(false);
});

test('isComputedProp TC8', () => {
  expect(isComputedProp("[[x]]")).toBe(false);
});

test('isComputedProp TC9', () => {
  expect(isComputedProp("")).toBe(false);
});

test('isComputedProp TC10', () => {
  expect(isComputedProp(undefined)).toBe(false);
});

test('isComputedProp TC11', () => {
  expect(isComputedProp(null)).toBe(false);
});

/**
 * Tests for potRawCompProp function
 */

test('potRawCompProp TC1', () => {
  expect(potRawCompProp("{{x}}")).toBe(true);
});

test('potRawCompProp TC2', () => {
  expect(potRawCompProp("{{`${x}`}}")).toBe(true);
});

test('potRawCompProp TC3', () => {
  expect(potRawCompProp("{{x+y}}")).toBe(true);
});

test('potRawCompProp TC4', () => {
  expect(potRawCompProp("{{x}}+{{y}}")).toBe(false);
});

test('potRawCompProp TC5', () => {
  expect(potRawCompProp("Tile {{y}}")).toBe(false);
});

test('potRawCompProp TC6', () => {
  expect(potRawCompProp("{{context[x]}}")).toBe(true);
});


/**
 * Tests for parseComputedProp function
 */

test('parseComputedProp TC1', () => {
  expect(parseComputedProp("{{x}}", {})({ "x": 1, "y": 2 })).toBe(1);
});

test('parseComputedProp TC2', () => {
  expect(parseComputedProp("{{x}} + {{y}}", {})({ "x": 1, "y": 2 })).toBe("1 + 2");
});

test('parseComputedProp TC3', () => {
  expect(parseComputedProp("{{`${x}`}}", {})({ "x": 1, "y": 2 })).toBe("1");
});

test('parseComputedProp TC4', () => {
  expect(parseComputedProp("{{`${x} + ${y}`}}", {})({ "x": 1, "y": 2 })).toBe("1 + 2");
});

test('parseComputedProp TC5', () => {
  expect(parseComputedProp("{{x + y}}", {})({ "x": 1, "y": 2 })).toBe(3);
});

test('parseComputedProp TC6', () => {
  expect(parseComputedProp("{{context[`${x}${y}`]}}", {})({ "x": 1, "y": 2, "12":3 })).toBe(3);
});

test('parseComputedProp TC7', () => {
  expect(parseComputedProp("Test {{x}}", {})({ "x": 1, "y": 2 })).toBe("Test 1");
});

test('parseComputedProp TC8', () => {
  expect(parseComputedProp("Test {{x}}", { "x": 5 })({})).toBe("Test 5");
});

test('parseComputedProp TC9', () => {
  expect(parseComputedProp("Test {{x}}", { "x": 5 })({ "x": 1 })).toBe("Test 1");
});

test('parseComputedProp TC10', () => {
  expect(parseComputedProp("{{100}}", {})({ "x": 1 })).toBe(100);
});

test('parseComputedProp TC11', () => {
  expect(parseComputedProp("{{x + 1}}", {})({ "x": 1 })).toBe(2);
});

test('parseComputedProp TC12', () => {
  expect(parseComputedProp("{{_aA01}}", {})({ "_aA01": 1 })).toBe(1);
});


/**
 * Tests for parseComp function
 */
const userComponents = {
  "tile": [
    {
      "$": "rect",
      "width": 1,
      "height": 1,
      "text": "{{`${x}${y}`}}"
    }
  ],
  "tilerow": [
    {
      "$": "tile",
      "x": 1
    },
    {
      "$": "tile",
      "x": 2
    },
    {
      "$": "tile",
      "x": 3
    }
  ],
  "tileboard": [
    {
      "$": "tilerow",
      "y": 1
    },
    {
      "$": "tilerow",
      "y": 2
    },
    {
      "$": "tilerow",
      "y": 3
    }
  ]
}

test('parseComp TC1', () => {
  expect(parseComps([
    {
      "$": "rect",
      "width": 1,
      "height": 1,
      "text": "{{context[`${x}${y}`]}}"
    }
  ]
    , {}, userComponents).map((ele) => { return { ...ele, "text": ele["text"](({ "x": 1, "y": 2, '12': 3 })) } }))
    .toStrictEqual([{
      "$": "rect",
      "width": 1,
      "height": 1,
      "text": 3
    }])
})

test('parseComp TC2', () => {
  expect(parseComps([
    {
      "$": "tilerow",
      "y": 1
    }
  ]
    , {}, userComponents).map((ele) => { return { ...ele, "text": ele["text"]({}) } }))
    .toStrictEqual(
      [{ "$": "rect", "height": 1, "text": "11", "width": 1, "x":1, "y":1 },
       { "$": "rect", "height": 1, "text": "21", "width": 1, "x":2, "y":1 },
       { "$": "rect", "height": 1, "text": "31", "width": 1, "x":3, "y":1 }])
})

test('parseComp TC3', () => {
  expect(parseComps([
    {
      "$": "tilerow",
      "y": 1
    },
    {
      "$": "tilerow",
      "y": 2
    },
    {
      "$": "tilerow",
      "y": 3
    }
  ]
    , {}, userComponents).map((ele) => { return { ...ele, "text": ele["text"]({}) } }))
    .toStrictEqual(
      [{ "$": "rect", "height": 1, "text": "11", "width": 1, "x":1, "y":1 },
       { "$": "rect", "height": 1, "text": "21", "width": 1, "x":2, "y":1 },
       { "$": "rect", "height": 1, "text": "31", "width": 1, "x":3, "y":1 },
       { "$": "rect", "height": 1, "text": "12", "width": 1, "x":1, "y":2 },
       { "$": "rect", "height": 1, "text": "22", "width": 1, "x":2, "y":2 },
       { "$": "rect", "height": 1, "text": "32", "width": 1, "x":3, "y":2 },
       { "$": "rect", "height": 1, "text": "13", "width": 1, "x":1, "y":3 },
       { "$": "rect", "height": 1, "text": "23", "width": 1, "x":2, "y":3 },
       { "$": "rect", "height": 1, "text": "33", "width": 1, "x":3, "y":3 }])
})

test('parseComp TC4', () => {
  expect(parseComps([
    {
      "$": "fasfasf",
      "width": 1,
      "height": 1,
      "text": "{{context[`${x}${y}`]}}"
    }
  ]
    , {}, userComponents)).toStrictEqual([])
})

/**
 * Tests for parseViews function
 */

test("parseViews TC1 - Tile View", () => {
  const views = parseViews({
    "components": {
      "tile": [
        {
          "$": "rect",
          "width": 1,
          "height": 1,
          "text": "{{context[`${x}${y}`]}}"
        }
      ],
      "tilerow": [
        {
          "$": "tile",
          "x": 1
        },
        {
          "$": "tile",
          "x": 2
        },
        {
          "$": "tile",
          "x": 3
        }
      ],
      "tileboard":[
        {
          "$": "tilerow",
          "y": 1
        },
        {
          "$": "tilerow",
          "y": 2
        },
        {
          "$": "tilerow",
          "y": 3
        }
      ]
    },
    "views": {
      "tiles": [{ "$":"tileboard" }],
      "main": [{ "$": "tree" }]
    }
  });
  const arr = [];
  for (const comp of views.tiles) {
    expect(comp["$"]).toBe("rect");
    expect(comp.height).toBe(1);
    expect(comp.width).toBe(1);
    arr.push(comp.text({"11":1, "12":2, "13":3, "21":4, "22":5, "23":6, "31":7, "32":8, "33":null}));
  }
  expect(arr).toEqual(
    expect.arrayContaining([1,2,3,4,5,6,7,8,null])
  );
})
