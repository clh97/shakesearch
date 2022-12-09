package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"index/suffixarray"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
)

func main() {
	searcher := Searcher{}
	err := searcher.Load("completeworks.txt")
	if err != nil {
		log.Fatal(err)
	}

	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	http.HandleFunc("/search", handleSearch(searcher))

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	fmt.Printf("Listening on port %s...", port)
	err = http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
	if err != nil {
		log.Fatal(err)
	}
}

type Searcher struct {
	CompleteWorks string
	SuffixArray   *suffixarray.Index
}

type SearcherResult struct {
	Page       int      `json:"page"`
	PageSize   int      `json:"pageSize"`
	Results    []string `json:"results"`
	Quantity   int      `json:"quantity"`
	TotalPages int      `json:"totalPages"`
}

func handleSearch(searcher Searcher) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		queries := r.URL.Query()

		pageNumber, _ := strconv.Atoi(queries.Get("page"))

		if pageNumber <= 0 {
			pageNumber = 1
		}

		pageSize, _ := strconv.Atoi(queries.Get("size"))

		if pageSize <= 0 {
			pageSize = 10
		}

		searchQuery := queries.Get("q")

		if len(searchQuery) < 1 {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("missing search query in URL params"))
			return
		}

		results := searcher.Search(searchQuery, pageNumber, pageSize)

		buf := &bytes.Buffer{}
		enc := json.NewEncoder(buf)
		err := enc.Encode(results)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("encoding failure"))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(buf.Bytes())
	}
}

func (s *Searcher) Load(filename string) error {
	dat, err := ioutil.ReadFile(filename)
	if err != nil {
		return fmt.Errorf("Load: %w", err)
	}
	s.CompleteWorks = string(dat)
	s.SuffixArray = suffixarray.New([]byte(strings.ToLower(s.CompleteWorks)))
	return nil
}

func (s *Searcher) Search(query string, page int, pageSize int) SearcherResult {
	lowerQuery := strings.ToLower(query)
	idxs := s.SuffixArray.Lookup([]byte(lowerQuery), -1)
	results := []string{}
	for _, idx := range idxs {
		start := idx - 250
		if start < 0 {
			start = 0
		}
		end := idx + 250
		if end > len(s.CompleteWorks) {
			end = len(s.CompleteWorks)
		}
		results = append(results, s.CompleteWorks[start:end])
	}
	return s.paginate(results, page, pageSize)
}

func (s *Searcher) paginate(results []string, page int, pageSize int) (r SearcherResult) {
	start := (page - 1) * pageSize
	end := start + pageSize
	if start > len(results) {
		return r
	}
	if end > len(results) {
		end = len(results)
	}
	r.Page = page
	r.PageSize = pageSize
	r.Results = results[start:end]
	r.Quantity = len(r.Results)
	r.TotalPages = len(results) / pageSize
	return r
}
