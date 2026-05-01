import * as React from "react";
import { createSearchParams, useSearchParams } from "react-router-dom";
import Document from "flexsearch/dist/module/document";

import { FeaturedArticles } from "./ui/molecules/featured";
import { Footer } from "./ui/molecules/footer";
import { Logo } from "./ui/atoms/logo";
import { Search } from "./ui/molecules/search";
import { SearchResults } from "./ui/molecules/search-results";
import { SuggestToolButton } from "./ui/molecules/suggest-tool-button";
import { SuggestToolDialog } from "./ui/molecules/suggest-tool";

import "./App.css";

function DeveloperToolchest() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchString, setSearchString] = React.useState("");
  const [tools, setTools] = React.useState(null);
  const [toolsIndex, setToolsIndex] = React.useState(null);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = React.useState(false);

  function doSearch(query, event) {
    event && event.preventDefault();

    setSearchString(query);
    setSearchParams(createSearchParams({ q: query }));

    const resultSet = toolsIndex.search(searchString);

    if (resultSet[0]) {
      const matches = resultSet[0].result.map((index) => tools[index]);
      setSearchResults(matches);
    } else {
      setSearchResults([]);
    }
  }

  function handleChange(event) {
    setSearchString(event.target.value.toLowerCase());
  }

  function handleOpenSuggestDialog() {
    setIsSuggestDialogOpen(true);
  }

  function handleCloseSuggestDialog() {
    setIsSuggestDialogOpen(false);
  }

  React.useEffect(() => {
    const jsonURL =
      import.meta.env.MODE === "testing" ? "/tools-test.json" : "/tools.json";

    async function fetchData() {
      const response = await fetch(jsonURL);
      const tools = await response.json();

      setTools(tools);

      const index = new Document({
        document: {
          index: ["tag", { field: "title", tokenize: "forward" }],
        },
      });

      tools.forEach((tool) => {
        index.add(tool);
      });

      setToolsIndex(index);
    }

    fetchData();
  }, []);

  React.useEffect(() => {
    const searchState = searchParams.get("q");

    if (searchState && toolsIndex) {
      setSearchString(searchState);
      const resultSet = toolsIndex.search(searchState);

      // when you have multiple indexes (`index: ["tag", "title"]`),
      // your result set can look something like this:
      // [
      //   { field: 'tag', result: [ 2, 3 ] },
      //   { field: 'title', result: [ 2 ] }
      // ]
      // We first create a flat array with all the matched ids called `allMatches`.
      // We initialize a new Set passing `allMatches` to remove duplicates. We can
      // now use our Set, to get the matched results from our data.
      const allMatches = resultSet.flatMap(({ result }) => result);
      const uniqueMatches = new Set(allMatches);

      if (uniqueMatches.size > 0) {
        setSearchResults(
          Array.from(uniqueMatches).map((result) =>
            tools.find((item) => item.id === result)
          )
        );
      }
    }
  }, [toolsIndex, searchParams, tools]);

  return (
    <div className="page-container">
      <div className="app-container">
        <div className="header-container">
          <Logo />
          <SuggestToolButton onClick={handleOpenSuggestDialog} />
        </div>
        <Search
          handleChange={handleChange}
          onSubmitCallback={doSearch}
          searchString={searchString}
          tools={tools}
        />

        {searchResults.length > 0 && (
          <SearchResults results={searchResults} onSubmitCallback={doSearch} />
        )}

        {searchString && !searchResults.length && (
          <p>
            No tools found for your query.{" "}
            <a
              href="https://github.com/schalkneethling/developer-toolchest"
              target="_blank"
              rel="noreferrer noopener"
            >
              Something missing? Open an issue
            </a>{" "}
            and let&apos;s fix that.
          </p>
        )}
        <FeaturedArticles />
      </div>
      <Footer />

      {/* Dialog for suggesting a tool */}
      <SuggestToolDialog
        isOpen={isSuggestDialogOpen}
        onClose={handleCloseSuggestDialog}
      />
    </div>
  );
}

export default DeveloperToolchest;
