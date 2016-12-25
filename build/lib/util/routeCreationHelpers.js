"use strict";
const logger_1 = require("../logger");
const state_1 = require("../state");
require("../twilioAugments");
const url = require("url");
const state_2 = require("../state");
function resolveBranches(state, inputData) {
    if (state_2.isBranchingState(state) && !state_2.isRenderableState(state)) {
        return Promise.resolve(state.transitionOut(inputData)).then(nextState => {
            return resolveBranches(nextState);
        });
    }
    return Promise.resolve(state);
}
exports.resolveBranches = resolveBranches;
function renderState(state, req, furl, inputData) {
    const urlForBound = makeUrlFor(req.protocol, req.get('Host'), furl);
    const renderableStatePromise = resolveBranches(state, inputData);
    const inputToRenderWith = state_2.isRenderableState(state) ? inputData : undefined;
    const couldNotFindRenderableStateError = Symbol();
    return renderableStatePromise.then(stateToRender => {
        const stateName = state_1.stateToString(stateToRender);
        if (state_2.isAsynchronousState(stateToRender)) {
            logger_1.default.info("Began asynchronous processing for " + stateName);
            stateToRender.backgroundTrigger(urlForBound, inputToRenderWith);
        }
        logger_1.default.info("Produced twiml for " + stateName);
        return stateToRender.twimlFor(urlForBound, inputToRenderWith);
    }, (e) => {
        throw { type: couldNotFindRenderableStateError, origError: e };
    }).catch((e) => {
        const origStateName = state_1.stateToString(state);
        const errorToString = (e) => e && e.message ? e.message : String(e);
        const [errorToThrow, genericMessageForErrorType] = (e && e.type === couldNotFindRenderableStateError) ?
            [e.origError, `Error while attempting to find the next state to render after ${origStateName}.`] :
            [e, `Error while attempting to render next state after ${origStateName}.`];
        const specificMessageFromThisError = errorToString(errorToThrow);
        logger_1.default.error(genericMessageForErrorType, specificMessageFromThisError);
        throw errorToThrow;
    });
}
exports.renderState = renderState;
function makeUrlFor(protocol, host, furl) {
    return (path, { query, absolute = false, fingerprint } = {}) => {
        if (fingerprint && query) {
            throw new Error("Can't combine fingerprinting with query parameters.");
        }
        if (fingerprint === undefined) {
            fingerprint = !query;
        }
        if (fingerprint) {
            if (!furl) {
                throw new Error("You must provide a fingerprinting function to generate " +
                    "fingerprinted urls.");
            }
            let fingerprintedRelativeUri = furl(path);
            if (absolute) {
                const relativeUriParts = url.parse(fingerprintedRelativeUri);
                return url.format({
                    protocol: protocol,
                    host: host,
                    pathname: relativeUriParts.pathname,
                    search: relativeUriParts.search
                });
            }
            return fingerprintedRelativeUri;
        }
        else {
            const formatOptions = { pathname: path, query: query || undefined };
            if (absolute) {
                formatOptions.protocol = protocol;
                formatOptions.host = host;
            }
            return url.format(formatOptions);
        }
    };
}
exports.makeUrlFor = makeUrlFor;
;
