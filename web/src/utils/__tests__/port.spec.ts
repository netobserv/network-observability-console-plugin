import { formatPort } from "../port"


describe('formatport', () => {
    it("should format port", () => {
	expect(formatPort(443)).toEqual("https (443)");
	expect(formatPort(32876)).toEqual("32876");
    });
});
