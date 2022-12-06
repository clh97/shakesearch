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

  const start = document.createElement("button");
  start.innerHTML = "&laquo;";
  start.classList.add("pagination-button--bold");
  start.addEventListener("click", (ev) => {
    Controller.search(ev, 1, pageSize);
  });
  pagination.appendChild(start);
  const prev = document.createElement("button");
  prev.innerHTML = "&laquo;";
  prev.addEventListener("click", (ev) => {
    Controller.search(ev, page - 1, pageSize);
  });
  pagination.appendChild(start);
  pagination.appendChild(prev);

  for (let i = page - 1 || 1; i < page + 5; i++) {
    if (i > totalPages) {
      return;
    }
    const pageButton = createPageButton(i, page, pageSize);
    pagination.appendChild(pageButton);
  }

  const pageButton = createPageButton(totalPages, page, pageSize);
  pagination.appendChild(pageButton);

  const end = document.createElement("button");
  end.innerHTML = "&raquo;";
  end.classList.add("pagination-button--bold");
  end.addEventListener("click", (ev) => {
    Controller.search(ev, totalPages, pageSize);
  });
  const next = document.createElement("button");
  next.innerHTML = "&raquo;";
  next.addEventListener("click", (ev) => {
    Controller.search(ev, page + 1, pageSize);
  });
  pagination.appendChild(next);
  pagination.appendChild(end);
};

const createPageButton = (text, page, pageSize) => {
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
