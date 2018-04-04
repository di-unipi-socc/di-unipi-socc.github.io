(function () {
  loadPeopleFrom();
  loadCollaboratorsFrom();
  loadProjectsFrom();
  loadPrototypesFrom();
})();

function loadPeopleFrom() {
  $.getJSON('resources/members.json', function (view) {
    view.SURNAME = function () {
      return this.surname.toUpperCase();
    };
    view.role = function () {
      switch (this.position) {
        case "full-professor":
          return "Full Professor";
        case "post-doc":
          return "Post-Doc Researcher";
        case "phd-student":
          return "PhD Student";
        case "research-assistant":
          return "Research assistant";
        case "msc":
          return "MSc Student";
        default:
          return "Other";
      }
    };
    render('#members-content', 'template/members.mst', view);
  });
}

function loadCollaboratorsFrom() {
  $.getJSON('resources/collaborators.json', function (view) {
    view.SURNAME = function () {
      return this.surname.toUpperCase();
    };
    render("#collaborators-content", 'template/collaborators.mst', view);
  });
}

function loadProjectsFrom() {
  $.getJSON('resources/research-projects.json', function (view) {
    view.logo = function () {
      switch (this.type) {
        case "eu":
          return "img/projects/eu.png";
        case "it":
          return "img/projects/it.png";
        case "toscana":
          return "img/projects/toscana.png";
        case "unipi":
          return "img/projects/unipi.png";
        default:
          return '';
      }
    };
    render("#projects-content", 'template/research-projects.mst', view);
  });
}

function loadPrototypesFrom() {
  console.log("in prototypes load function")
  $.getJSON('resources/prototypes.json', function (view) {
    console.log("prototypes rendering - start");
    render("#prototypes-content", 'template/prototypes.mst', view);
    console.log("prototypes rendering - done");
  });
}

function render(target, template_file, view) {
  $.get(template_file, function (template) {
    var rendered = Mustache.render(template, view);
    //console.log(view);
    $(target).html(rendered);
  });
}