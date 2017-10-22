const expect = require("chai");


describe("Testing the heating control application", () => {
    it("should return the right FHEM device for the living room", () => {
        expect(i.shouldNotIndex(searchRequest)).to.eql(false);
    });
});