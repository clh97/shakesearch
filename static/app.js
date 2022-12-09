const Controller = {
  search: (ev, page, pageSize) => {
    ev.preventDefault();
    const resultSection = document.getElementById("result-section");
    const form = document.getElementById("form");
    const data = Object.fromEntries(new FormData(form));

    if (data.query.length === 0) {
      resultSection.style.display = "none";
      form.classList.add("error");
      return;
    }

    resultSection.style.display = "block";
    form.classList.remove("error");

    fetch(`/search?q=${data.query}&page=${page}&size=${pageSize}`).then(
      (response) => {
        response
          .json()
          .then(({ results, page, pageSize, quantity, totalPages }) => {
            Controller.updateTable(
              results,
              page,
              pageSize,
              totalPages,
              quantity,
              data.query
            );
          });
      }
    );
  },

  updateTable: (results, page, pageSize, totalPages, quantity, query) => {
    const table = document.getElementById("table-body");
    const pagination = document.getElementById("pagination");

    table.innerHTML = "";

    if (results.length >= pageSize) {
      pagination.style.display = "flex";
    } else {
      pagination.style.display = "none";
    }

    if (quantity === 0) {
      appendToTable("No results found", "");
      return;
    }

    for (let result of results) {
      appendToTable(result, query);
    }

    updatePagination(page, pageSize, totalPages);

    const prevButton = document.getElementById("prev");
    const startButton = document.getElementById("start");
    const nextButton = document.getElementById("next");
    const endButton = document.getElementById("end");

    if (page === 1) {
      prevButton.disabled = true;
      startButton.disabled = true;

      nextButton.disabled = false;
      endButton.disabled = false;
    } else if (page === totalPages) {
      prevButton.disabled = false;
      startButton.disabled = false;

      nextButton.disabled = true;
      endButton.disabled = true;
    }
  },
};

const form = document.getElementById("form");
form.addEventListener("submit", (ev) => Controller.search(ev, 1, 10));

const appendToTable = (result, query) => {
  const table = document.getElementById("table-body");
  const row = document.createElement("tr");
  const data = document.createElement("td");

  const regex = new RegExp(query, "gi");
  const highlighted = result.replace(regex, `<mark>${query}</mark>`);
  data.innerHTML = highlighted;

  row.appendChild(data);
  table.appendChild(row);
};

const updatePagination = (page = 1, pageSize = 10, totalPages) => {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const startButtonsContainer = document.createElement("div");
  const endButtonsContainer = document.createElement("div");
  startButtonsContainer.classList.add("pagination__buttons");
  endButtonsContainer.classList.add("pagination__buttons");
  const paginationItemsContainer = document.createElement("div");
  paginationItemsContainer.classList.add("pagination__pages");

  const start = document.createElement("button");
  start.id = "start";
  start.innerHTML = "&laquo;";
  start.classList.add("pagination-button--bold");
  start.addEventListener("click", (ev) => {
    Controller.search(ev, 1, pageSize);
  });
  pagination.appendChild(start);
  const prev = document.createElement("button");
  prev.id = "prev";
  prev.innerHTML = "&laquo;";
  prev.addEventListener("click", (ev) => {
    Controller.search(ev, page - 1, pageSize);
  });
  startButtonsContainer.appendChild(start);
  startButtonsContainer.appendChild(prev);
  pagination.appendChild(startButtonsContainer);

  for (
    let i = page >= totalPages - 5 ? totalPages - 5 : page;
    i <= page + 5;
    i++
  ) {
    if (i > totalPages) {
      break;
    }
    const pageButton = createPageButton(i, page, totalPages, pageSize);
    paginationItemsContainer.appendChild(pageButton);
  }

  pagination.appendChild(paginationItemsContainer);

  const end = document.createElement("button");
  end.id = "end";
  end.innerHTML = "&raquo;";
  end.classList.add("pagination-button--bold");
  end.addEventListener("click", (ev) => {
    Controller.search(ev, totalPages, pageSize);
  });
  const next = document.createElement("button");
  next.id = "next";
  next.innerHTML = "&raquo;";
  next.addEventListener("click", (ev) => {
    Controller.search(ev, page + 1, pageSize);
  });
  endButtonsContainer.appendChild(next);
  endButtonsContainer.appendChild(end);
  pagination.appendChild(endButtonsContainer);
};

const createPageButton = (text, page, totalPages, pageSize) => {
  const pageButton = document.createElement("button");
  pageButton.innerHTML = text;
  if (text === page) {
    pageButton.classList.add("active");
  }
  pageButton.addEventListener("click", (ev) => {
    Controller.search(ev, text, pageSize);
  });
  return pageButton;
};
