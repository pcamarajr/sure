import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = [
    "nameDisplay",
    "nameInput",
    "actionsContainer",
    "deleteButton",
    "addButton",
    "chevron",
  ];

  static values = {
    categoryId: String,
    updateUrl: String,
  };

  connect() {
    this.isEditing = false;
    this.originalName = this.nameDisplayTarget.textContent.trim();
    this.isExpanded = true; // Default to expanded
  }

  startEdit() {
    if (this.isEditing) return;

    this.isEditing = true;
    this.nameDisplayTarget.classList.add("hidden");
    this.nameInputTarget.classList.remove("hidden");
    this.nameInputTarget.focus();
    this.nameInputTarget.select();
  }

  cancelEdit() {
    if (!this.isEditing) return;

    this.isEditing = false;
    this.nameInputTarget.value = this.originalName;
    this.nameDisplayTarget.classList.remove("hidden");
    this.nameInputTarget.classList.add("hidden");
  }

  saveEdit() {
    if (!this.isEditing) return;

    const newName = this.nameInputTarget.value.trim();

    if (newName === this.originalName) {
      this.cancelEdit();
      return;
    }

    if (!this.validateName(newName)) {
      this.cancelEdit();
      return;
    }

    // Update the display immediately for better UX
    this.nameDisplayTarget.textContent = newName;
    this.originalName = newName;
    this.isEditing = false;
    this.nameDisplayTarget.classList.remove("hidden");
    this.nameInputTarget.classList.add("hidden");

    // Send update to server
    this.updateCategoryName(newName);
  }

  handleKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.saveEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  handleNameKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.startEdit();
    }
  }

  handleBlur() {
    // Auto-save on blur
    this.saveEdit();
  }

  async updateCategoryName(newName) {
    // Show loading state
    this.element.style.opacity = "0.6";
    this.element.style.pointerEvents = "none";

    try {
      const formData = new FormData();
      formData.append("category[name]", newName);

      const csrfToken = document.querySelector(
        'meta[name="csrf-token"]',
      )?.content;
      if (!csrfToken) {
        throw new Error("CSRF token not found");
      }
      formData.append("authenticity_token", csrfToken);

      const response = await fetch(this.updateUrlValue, {
        method: "PATCH",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          Accept: "text/vnd.turbo-stream.html",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      // Handle Turbo Stream response
      const turboStream = await response.text();
      Turbo.renderStreamMessage(turboStream);
    } catch (error) {
      console.error("Error updating category:", error);
      this.showErrorFlash("Failed to update category. Please try again.");
      // Revert on error
      this.nameDisplayTarget.textContent = this.originalName;
    } finally {
      // Restore normal state
      this.element.style.opacity = "1";
      this.element.style.pointerEvents = "auto";
    }
  }

  showActions() {
    this.actionsContainerTarget.classList.remove("opacity-0");
    this.actionsContainerTarget.classList.add("opacity-100");
  }

  hideActions() {
    this.actionsContainerTarget.classList.remove("opacity-100");
    this.actionsContainerTarget.classList.add("opacity-0");
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;

    if (this.hasChevronTarget) {
      if (this.isExpanded) {
        this.chevronTarget.classList.remove("rotate-90");
      } else {
        this.chevronTarget.classList.add("rotate-90");
      }
    }

    // Dispatch custom event for parent component to handle subcategory visibility
    this.dispatch("toggleExpanded", {
      detail: {
        categoryId: this.categoryIdValue,
        isExpanded: this.isExpanded,
      },
    });
  }

  addSubcategory() {
    // Dispatch custom event for parent component to handle adding subcategory
    this.dispatch("addSubcategory", {
      detail: {
        parentId: this.categoryIdValue,
      },
    });
  }

  deleteCategory() {
    // Dispatch custom event for parent component to handle deletion
    this.dispatch("deleteCategory", {
      detail: {
        categoryId: this.categoryIdValue,
      },
    });
  }

  validateName(name) {
    if (name.length === 0) {
      this.showErrorFlash("Category name cannot be empty");
      return false;
    }
    if (name.length > 255) {
      this.showErrorFlash("Category name is too long (maximum 255 characters)");
      return false;
    }
    return true;
  }

  showErrorFlash(message) {
    const flashHTML = `
      <turbo-stream action="prepend" target="flash">
        <template>
          <div class="alert alert-error">${message}</div>
        </template>
      </turbo-stream>
    `;
    Turbo.renderStreamMessage(flashHTML);
  }
}
