"use strict";const expectedCaches=["static-v2"];self.addEventListener("install",(e=>{e.waitUntil(caches.open("static-v2"))})),self.addEventListener("activate",(e=>{e.waitUntil(caches.keys().then((e=>Promise.all(e.map((e=>{if(!expectedCaches.includes(e))return caches.delete(e)}))))).then((()=>{console.log("V2 now ready to handle fetches!")})))})),self.addEventListener("fetch",(e=>{new URL(e.request.url)}));const applicationServerPublicKey="BAffSuWmvVXgwT1ZvqHy6P2Y7N9-MFP3ulJXufUeIIez2qzxjjp_bnf4IV6oqPYgRN9SMUMs5UDiXKt95zgkXo0";function urlB64ToUint8Array(e){const t=(e+"=".repeat((4-e.length%4)%4)).replace(/\-/g,"+").replace(/_/g,"/"),n=window.atob(t),i=new Uint8Array(n.length);for(let e=0;e<n.length;++e)i[e]=n.charCodeAt(e);return i}self.addEventListener("push",(function(e){console.log("[Service Worker] Push Received."),e.data?console.log(`[Service Worker] Push had this data: "${e.data.text()}"`):console.log("[Service Worker] Push had this NO data");const t={body:e.data?e.data.text():"<no data>",icon:"icon.png",badge:"badge.png"};e.waitUntil(self.registration.showNotification("Agro Telemetry",t))})),self.addEventListener("notificationclick",(function(e){console.log("[Service Worker] Notification click Received."),e.notification.close(),e.waitUntil(clients.openWindow("http://127.0.0.1:8080/"))})),self.addEventListener("pushsubscriptionchange",(function(e){console.log("[Service Worker]: 'pushsubscriptionchange' event fired.");const t=urlB64ToUint8Array(applicationServerPublicKey);e.waitUntil(self.registration.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:t}).then((function(e){console.log("[Service Worker] New subscription: ",e)})))}));