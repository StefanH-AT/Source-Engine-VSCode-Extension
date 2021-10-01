import { ClrTagInfo, populateColorTagMatches } from "./kv-caption-tag-matches";

test("Caption <clr> tag", () => {

    const value = "<clr:255,125,240>This is a captions sentence with a <i>lot<i> of other <clr:25,225,212>tags";

    const colors = populateColorTagMatches(value);

    expect(colors.length).toBe(2);
    expect(colors[0].color.r).toBe(255);
    expect(colors[0].color.g).toBe(125);
    expect(colors[0].color.b).toBe(240);

    expect(colors[1].color.r).toBe(25);
    expect(colors[1].color.g).toBe(225);
    expect(colors[1].color.b).toBe(212);
});

test("Caption <playerclr> tag", () => {

    const value = "<playerclr:255,125,240:255,100,30>This is a captions sentence with a <i>lot<i> of other <playerclr:25,225,212:255,0,3>tags";

    const colors = populateColorTagMatches(value);

    expect(colors.length).toBe(4);
    expect(colors[0].color.r).toBe(255);
    expect(colors[0].color.g).toBe(125);
    expect(colors[0].color.b).toBe(240);

    expect(colors[1].color.r).toBe(255);
    expect(colors[1].color.g).toBe(100);
    expect(colors[1].color.b).toBe(30);

    expect(colors[2].color.r).toBe(25);
    expect(colors[2].color.g).toBe(225);
    expect(colors[2].color.b).toBe(212);

    expect(colors[3].color.r).toBe(255);
    expect(colors[3].color.g).toBe(0);
    expect(colors[3].color.b).toBe(3);
});