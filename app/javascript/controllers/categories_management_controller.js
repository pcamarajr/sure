import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["subcategoriesContainer"];

  connect() {
    // Listen for custom events from category rows
    this.element.addEventListener("category-row:toggleExpanded", this.handleToggleExpanded.bind(this));
    this.element.addEventListener("category-row:addSubcategory", this.handleAddSubcategory.bind(this));
    this.element.addEventListener("category-row:deleteCategory", this.handleDeleteCategory.bind(this));
  }

  disconnect() {
    this.element.removeEventListener("category-row:toggleExpanded", this.handleToggleExpanded.bind(this));
    this.element.removeEventListener("category-row:addSubcategory", this.handleAddSubcategory.bind(this));
    this.element.removeEventListener("category-row:deleteCategory", this.handleDeleteCategory.bind(this));
  }

  handleToggleExpanded(event) {
    const { categoryId, isExpanded } = event.detail;
    const container = this.element.querySelector(`[data-parent-id="${categoryId}"]`);
    
    if (container) {
      if (isExpanded) {
        container.style.display = "block";
      } else {
        container.style.display = "none";
      }
    }
  }

  handleAddSubcategory(event) {
    const { parentId } = event.detail;
    
    // For now, just redirect to the new category form with parent pre-selected
    // In a full implementation, this could open an inline form or modal
    const url = new URL(`${window.location.origin}/categories/new`);
    url.searchParams.set("parent_id", parentId);
    window.location.href = url.toString();
  }

  handleDeleteCategory(event) {
    const { categoryId } = event.detail;
    
    // For now, just redirect to the delete confirmation
    // In a full implementation, this could show an inline confirmation
    const url = new URL(`${window.location.origin}/categories/${categoryId}`);
    if (confirm("Are you sure you want to delete this category?")) {
      fetch(url.toString(), {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
          "Accept": "text/vnd.turbo-stream.html"
        }
      }).then(response => {
        if (response.ok) {
          // Remove the category row from the DOM
          const categoryRow = this.element.querySelector(`[data-category-row-category-id-value="${categoryId}"]`);
          if (categoryRow) {
            categoryRow.remove();
          }
        }
      });
    }
  }
}
