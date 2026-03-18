package main

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// https://chat.joelsiervas.online/messages
var chatApi = "https://chat.joelsiervas.online"

func getMessages(w http.ResponseWriter, r *http.Request) {
	resp, _ := http.Get(chatApi + "/messages")

	io.Copy(w, resp.Body)
}

func postMessage(w http.ResponseWriter, r *http.Request) {
	resp, _ := http.Post(chatApi+"/messages", "application/json", r.Body)
	defer resp.Body.Close()

	io.Copy(w, resp.Body)

}

func getPreview(w http.ResponseWriter, r *http.Request) {
	rawURL := r.URL.Query().Get("url")
	if rawURL == "" {
		http.Error(w, "url requerida", http.StatusBadRequest)
		return
	}

	parsed, err := url.ParseRequestURI(rawURL)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		http.Error(w, "url inválida", http.StatusBadRequest)
		return
	}

	client := &http.Client{}
	req, _ := http.NewRequest("GET", rawURL, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; ChatBot/1.0)")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "error al obtener la página", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	io.Copy(w, resp.Body)
}

func main() {
	http.Handle("GET /", http.FileServer(http.Dir("static")))
	http.HandleFunc("GET /api/messages", getMessages)
	http.HandleFunc("POST /api/messages", postMessage)
	http.HandleFunc("GET /api/preview", getPreview)

	fmt.Println("Server running on port 8000")
	http.ListenAndServe("0.0.0.0:8000", nil)
	//lsof -i 8000

}
