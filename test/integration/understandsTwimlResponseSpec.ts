import twilio = require("twilio");
import request = require("supertest");
import lib from "../../lib/";
import { UsableState } from "../../lib/state";

const states: UsableState[] = [
  //tslint:disable-next-line:no-object-literal-type-assertion
  <UsableState> {
    uri: "/returns-twiml-response",
    name: "DUMMY",
    isEndState: true,
    twimlFor() { return new twilio.TwimlResponse(); }
  },

  //tslint:disable-next-line:no-object-literal-type-assertion
  <UsableState> {
    uri: "/returns-twiml-string",
    name: "DUMMY",
    isEndState: true,
    twimlFor() { return 'Test'; }
  }
];

describe("rending Twiml", () => {
  const app = lib(states, { twilio: { authToken: "", validate: false } });

  it("should render TwimlResponse object", () => {
    return request(app)
      .post("/returns-twiml-response")
      .expect('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  });

  it("should still be able to render strings", () => {
    return request(app)
      .post("/returns-twiml-string")
      .expect('Test');
  });
});
