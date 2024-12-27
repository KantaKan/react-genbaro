import React, { useState } from "react";

const FormComponent = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    techHappy: "",
    techImprove: "",
    nonTechHappy: "",
    nonTechImprove: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const pages = [
    { id: 1, name: "Tech Happy", title: "ส่วนที่คุณทำได้ดี", field: "techHappy", isTechnical: true },
    { id: 2, name: "Tech Improve", title: "ส่วนที่ควรปรับปรุง", field: "techImprove", isTechnical: true },
    { id: 3, name: "Non-Tech Happy", title: "ส่วนที่คุณทำได้ดี", field: "nonTechHappy", isTechnical: false },
    { id: 4, name: "Non-Tech Improve", title: "ส่วนที่ควรปรับปรุง", field: "nonTechImprove", isTechnical: false },
  ];

  const currentPageData = pages[currentPage - 1];

  const validateField = (name, value) => {
    if (!value || value.trim() === "") {
      return "This field is required";
    }
    if (value.trim().length < 10) {
      return "Please provide at least 10 characters";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate on change
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const isCurrentPageValid = () => {
    const currentField = currentPageData.field;
    return !errors[currentField] && formData[currentField].trim().length >= 10;
  };

  const getBreadcrumbItems = () => {
    return pages.slice(0, currentPage).map((page) => ({
      name: page.name,
      isCompleted: page.id < currentPage,
      isCurrent: page.id === currentPage,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentField = currentPageData.field;

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [currentField]: true,
    }));

    // Validate current field
    const error = validateField(currentField, formData[currentField]);
    setErrors((prev) => ({
      ...prev,
      [currentField]: error,
    }));

    if (!error) {
      if (currentPage < pages.length) {
        setCurrentPage((prev) => prev + 1);
      } else {
        console.log("Final form data:", formData);
        // Handle final submission here
      }
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const getSessionTitle = () => {
    return currentPageData.isTechnical ? "Technical Session" : "Non-Technical Session";
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      {/* Enhanced breadcrumb navigation */}
      <div className="flex flex-wrap items-center gap-2 text-sm mb-6">
        <span className="text-blue-600 font-medium">{getSessionTitle()}</span>
        {getBreadcrumbItems().map((item, index) => (
          <React.Fragment key={index}>
            <span className="text-gray-400">›</span>
            <span className={`${item.isCurrent ? "text-gray-800 font-medium" : item.isCompleted ? "text-blue-600" : "text-gray-600"}`}>{item.name}</span>
          </React.Fragment>
        ))}
      </div>

      {/* Dynamic Title */}
      <h1 className="text-3xl font-bold mb-8">{getSessionTitle()}</h1>

      {/* Content card with form */}
      <div className="bg-gray-700 rounded-lg p-8 mb-8">
        <h2 className="text-2xl text-white font-normal mb-6">{currentPageData.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <textarea
              id={currentPageData.field}
              name={currentPageData.field}
              value={formData[currentPageData.field]}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="6"
              className={`w-full px-4 py-2 rounded-md bg-gray-600 text-white border focus:ring-1 
                  ${
                    touched[currentPageData.field] && errors[currentPageData.field]
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-500 focus:border-blue-500 focus:ring-blue-500 placeholder:text-5xl placeholder:text-gray-400"
                  }`}
              placeholder={currentPageData.title}
            />
            {touched[currentPageData.field] && errors[currentPageData.field] && <div className="text-red-400 text-sm mt-1">{errors[currentPageData.field]}</div>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isCurrentPageValid()}
              className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 
                  ${isCurrentPageValid() ? "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500" : "bg-gray-400 cursor-not-allowed text-gray-200 focus:ring-gray-400"}`}
            >
              {currentPage === pages.length ? "Submit" : "Save & Continue"}
            </button>
          </div>
        </form>
      </div>

      {/* Navigation buttons - only Previous */}
      <div className="flex justify-start mt-4">
        <button onClick={handlePrevious} className={`flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 ${currentPage === 1 ? "invisible" : ""}`}>
          <span>‹</span>
          <span>Previous</span>
        </button>
      </div>
    </div>
  );
};

export default FormComponent;
