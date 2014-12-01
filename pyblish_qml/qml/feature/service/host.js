"use strict";
/*global Constant, listConstant, print, XMLHttpRequest*/
/*global mockHost, Qt, root, Component, log*/


// Merge port from Python with current API prefix
function get_base() {
    return "http://127.0.0.1:" + Constant.port + Constant.urlPrefix;
}

/*
 * MockHTTPRequest communicates with a fake Flask
 * client which emulates a production host.
 *
*/
function MockHTTPRequest() {
    var component = Qt.createComponent("../app/MockHTTPRequest.qml"),
        mhr;

    this.readyState = null;
    this.ERROR = 0;
    this.READY = 1;

    if (component.status === Component.Error) {
        this.readyState = this.ERROR;
        this.errorString = component.errorString;
    } else {
        mhr = component.createObject(root);
        console.assert(mhr !== "undefined", "This file should never fail");

        this.readyState = this.READY;
        this.request = mhr.request;
        this.requested = mhr.requested;
    }
}


function real_request(verb, endpoint, obj, cb) {
    var xhr = new XMLHttpRequest(),
        data;

    endpoint = get_base() + (endpoint || "");

    xhr.onreadystatechange = function () {
        if (cb && xhr.readyState === xhr.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
                var res = JSON.parse(xhr.responseText.toString());
                cb(res);

            } else {
                log.error("Error connecting to:", endpoint,
                          "Status:", xhr.status);
            }
        }
    };

    xhr.ontimeout = function () {
        print("Request timed out");
    };

    xhr.open(verb, endpoint);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    data = obj ? JSON.stringify(obj) : "";
    xhr.send(data);
}


function mock_request(verb, endpoint, obj, cb) {
    var mhr = new MockHTTPRequest();

    if (mhr.readyState === mhr.ERROR) {
        return print("Running standalone");
    }

    mhr.requested.connect(cb);
    mhr.request(verb, get_base() + (endpoint || ""), obj);
}


function request(verb, endpoint, obj, cb) {
    log.debug("Request:", verb, get_base() + (endpoint || ""));

    if (Constant.port === 0) {
        return mock_request(verb, endpoint, obj, cb);
    }
    console.assert(Constant.port !== 0);
    return real_request(verb, endpoint, obj, cb);
}


function onReady(cb) {
    // Connect and initialise host cb is called upon completion.
    request("POST", "/session", null, cb);

}

function getInstances(cb) {
    request("GET", "/instances", null, cb);
}


function getPlugins(cb) {
    request("GET", "/plugins", null, cb);
}


function getApplication(cb) {
    request("GET", "/application", null, cb);
}


function getProcesses(cb) {
    request("GET", "/processes", null, cb);
}

function getProcess(process_id, cb) {
    request("GET", "/processes/" + process_id, null, cb);
}

function postProcesses(instance, plugin, cb) {
    request("POST", "/processes",
            {"instance": instance, "plugin": plugin}, cb);
}