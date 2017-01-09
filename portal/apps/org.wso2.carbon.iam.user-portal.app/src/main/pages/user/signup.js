/*
 *  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

function onRequest(env) {

    if (env.request.method == "POST") {
        var formParams = {};
        var claimMap = {};
        var credentialMap = {};
        var domain;
        formParams = env.request.formParams;
        for (var i in formParams) {
            if (i == "password") {
                credentialMap["password"] = formParams[i];
            } else if (i == "domain") {
                domain = i;
            } else {
                claimMap[i] = formParams[i];
            }
        }

        var userRegistration = callOSGiService("org.wso2.is.portal.user.client.api.IdentityStoreClientService",
            "addUser", [claimMap, credentialMap]);
        if (userRegistration != null && userRegistration.userId != null) {
            /*sendRedirect(env.contextPath + env.config['loginPageUri'] + "?method=POST&username=" + claimMap["http://wso2.org/claims/username"]
             + "&password=" + credentialMap["password"] + "&domain=" + domain);*/
            authenticate(claimMap["http://wso2.org/claims/username"], credentialMap["password"]);
            sendRedirect(env.contextPath + env.config['loginPageUri']);
        }
    }

    if (env.request.method == "GET") {
        var claimProfile = callOSGiService("org.wso2.is.portal.user.client.api.ProfileMgtClientService",
            "getProfile", ["self-signUp"]);
        var claimForProfile = claimProfile.claims;

        var profileMgtUtil = Java.type("org.wso2.is.portal.user.client.api.util.ProfileMgtUtil");
        var profileMgt = new ProfileMgtUtil();

        var claimArray = [];
        for (var i = 0; i < claimForProfile.length; i++) {
            claimArray[i] = profileMgt.getClaimProfile(claimForProfile[i]);
        }
        sendToClient("signupClaims", claimArray);
        return {"signupClaims": claimArray};
    }
}

function authenticate(username, password) {
    try {
        var passwordChar = Java.to(password.split(''), 'char[]');
        var authenticationContext = callOSGiService("org.wso2.is.portal.user.client.api.IdentityStoreClientService",
            "authenticate", [username, passwordChar]);

        createSession(authenticationContext.user);
        return {success: true, message: "success"}
    } catch (e) {
        var message = e.message;
        var cause = e.getCause();
        if (cause != null) {
            //the exceptions thrown by the actual osgi service method is wrapped inside a InvocationTargetException.
            if (cause instanceof java.lang.reflect.InvocationTargetException) {
                message = cause.getTargetException().message;
            }
        }

        return {success: false, message: message};
    }
}