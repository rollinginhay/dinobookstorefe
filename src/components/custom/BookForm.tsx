"use client";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import dynamic from "next/dynamic";
import React, {useEffect, useRef, useState} from "react";
import {useBookProperty} from "@/hooks/api-calls/useBookProperty";
import {BaseProperty} from "@/components/custom/MultiSelectCreatable";
import Form from "@/components/form/Form";
import TextArea from "@/components/form/input/TextArea";
import ImagePicker from "@/components/custom/ImagePicker";
import {uploadToCloudinary} from "@/lib/cloudinaryUpload";
import {useBook} from "@/hooks/api-calls/useBook";
import SelectCreatable from "@/components/custom/SelectCreatable";
import {useParams, useRouter} from "next/navigation";
import {useBookSingle} from "@/hooks/api-calls/useBookSingle";
import {getDateForInput, todayDateString} from "@/lib/formatters";
import {deserializeBook} from "@/lib/serializers";
import {ChevronDownIcon} from "@/icons";

//explicitly client impprt to prevent hydration errors
const MultiSelectCreatable = dynamic(
    () => import("@/components/custom/MultiSelectCreatable"),
    {ssr: false}
);


export default function BookForm() {
    const router = useRouter();
    const params = useParams();
    const bookId = params.id?.toString();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const bookFetch = bookId ? useBookSingle(bookId) : null;


    const {propertyQuery: genreQuery, propertyCreate: genreCreate} = useBookProperty("genre", 0, 100, true);
    const {propertyQuery: creatorQuery, propertyCreate: creatorCreate} = useBookProperty("creator", 0, 100, true);
    const {propertyQuery: publisherQuery, propertyCreate: publisherCreate} = useBookProperty("publisher", 0, 100, true);

    const {bookCreate} = useBook();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        attributes: {
            id: 0,
            title: "",
            edition: "",
            language: "",
            published: "",
            imageUrl: "",
            blurb: "",
        },
        relationships: {
            genres: [] as BaseProperty[],
            creators: [] as BaseProperty[],
            publisher: null as BaseProperty | null
        }
    });
    const hasInit = useRef(false);
    const imageChanged = useRef(false);
    const [errors, setErrors] = useState({
        title: "",
        edition: "",
        language: "",
        published: "",
        genres: "",
        creators: "",
        publisher: "",
        imageUrl: ""
    });

    useEffect(() => {
        if (!bookId) return;
        if (!bookFetch?.isSuccess) return;

        if (!hasInit.current && bookFetch.data) {
            const book = bookFetch.data.data;
            setFormData(deserializeBook(book));
            hasInit.current = true;
        }
    }, [bookId, bookFetch?.isSuccess, bookFetch?.data]);

    // function updateFormData<T extends keyof typeof formData>(
    //     key: T,
    //     value: (typeof formData)[T]
    // ) {
    //     setFormData(prev => ({
    //         ...prev,
    //         [key]: value,
    //     }));
    // }
    //new ver supports deep nesting

    if ((bookId && bookFetch?.isLoading) ||
        genreQuery.isLoading ||
        creatorQuery.isLoading ||
        publisherQuery.isLoading) {
        return <p className="p-6">Đang tải...</p>;
    }


    function updateFormData(path: string, value: any) {
        setFormData(prev => {
            const copy = structuredClone(prev); // deep clone

            const keys = path.split(".");
            let obj: any = copy;

            for (let i = 0; i < keys.length - 1; i++) {
                obj = obj[keys[i]];
            }

            obj[keys[keys.length - 1]] = value;

            return copy;
        });
    }


    async function handleSubmit(e) {
        e.preventDefault();
        
        // Validate tất cả các trường
        const newErrors = {
            title: "",
            edition: "",
            language: "",
            published: "",
            genres: "",
            creators: "",
            publisher: "",
            imageUrl: ""
        };
        
        let hasError = false;
        
        // Validate Tiêu đề
        if (!formData.attributes.title || formData.attributes.title.trim() === "") {
            newErrors.title = "Vui lòng nhập tiêu đề sách";
            hasError = true;
        }
        
        // Validate Phiên bản
        if (!formData.attributes.edition || formData.attributes.edition.trim() === "") {
            newErrors.edition = "Vui lòng nhập phiên bản";
            hasError = true;
        }
        
        // Validate Ngôn ngữ
        if (!formData.attributes.language || formData.attributes.language.trim() === "") {
            newErrors.language = "Vui lòng chọn ngôn ngữ";
            hasError = true;
        }
        
        // Validate Ngày xuất bản
        if (!formData.attributes.published || formData.attributes.published.trim() === "") {
            newErrors.published = "Vui lòng chọn ngày xuất bản";
            hasError = true;
        } else {
            // Validate ngày xuất bản không được quá ngày hiện tại
            const publishedDate = new Date(formData.attributes.published);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // Set to end of today for comparison
            
            if (publishedDate > today) {
                newErrors.published = "Ngày xuất bản không được quá ngày hiện tại";
                hasError = true;
            }
        }
        
        // Validate Thể loại
        if (!formData.relationships.genres || formData.relationships.genres.length === 0) {
            newErrors.genres = "Vui lòng chọn ít nhất một thể loại";
            hasError = true;
        }
        
        // Validate Tác giả
        if (!formData.relationships.creators || formData.relationships.creators.length === 0) {
            newErrors.creators = "Vui lòng chọn ít nhất một tác giả";
            hasError = true;
        }
        
        // Validate Nhà xuất bản
        if (!formData.relationships.publisher) {
            newErrors.publisher = "Vui lòng chọn nhà xuất bản";
            hasError = true;
        }
        
        // Validate Ảnh bìa sách (chỉ validate nếu đang tạo mới, không phải edit)
        if (!bookId && !formData.attributes.imageUrl && !imageFile) {
            newErrors.imageUrl = "Vui lòng chọn ảnh bìa sách";
            hasError = true;
        }
        
        setErrors(newErrors);
        
        if (hasError) {
            return;
        }
        
        let updated = formData;
        if (imageFile && imageChanged.current) {
            const imageUrl = await uploadToCloudinary(imageFile);
            updateFormData("attributes.imageUrl", imageUrl);
            updated = {
                ...formData,
                attributes: {
                    ...formData.attributes,
                    imageUrl: imageUrl
                }
            };
            console.log(updated);
        }
        
        // Convert published date from YYYY-MM-DD to LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
        if (updated.attributes.published) {
            const dateStr = updated.attributes.published;
            // If it's already in YYYY-MM-DD format, convert to LocalDateTime
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                updated = {
                    ...updated,
                    attributes: {
                        ...updated.attributes,
                        published: `${dateStr}T00:00:00`
                    }
                };
            }
        }
        
        const res = await bookCreate.mutateAsync(updated);
        console.log(res);
        const id = res.data.id;
        router.push(`/book/${id}`);

    }

    const handleCreateOption = (property: string, name: string) => {
        switch (property) {
            case "genre":
                genreCreate.mutate({name: name});
                break;
            case "creators":
                creatorCreate.mutate({name: name});
                break;
            case "publisher":
                publisherCreate.mutate({name: name});
                break;
        }
    };

    return (
  <div className="space-y-6">
    <div className="mb-4">
      <Button
        variant="outline"
        onClick={() => router.push("/books")}
        className="inline-flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Quay lại
      </Button>
    </div>
    <Form onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Thông tin sách
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 dark:border-gray-800">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            {/* Cột 1 */}
            <div className="space-y-6">
              {/* Tiêu đề - Full width trong cột */}
              <div>
                <Label className="mb-2 block">Tiêu đề <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Nhập tiêu đề sách"
                  value={formData.attributes.title}
                  onChange={(e) => {
                    updateFormData("attributes.title", e.target.value);
                    if (e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, title: "" }));
                    }
                  }}
                  className={errors.title ? "border-red-500 focus:border-red-500" : ""}
                />
                {errors.title && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Ngôn ngữ */}
              <div>
                <Label className="mb-2 block">Ngôn ngữ <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <select
                    value={formData.attributes.language}
                    onChange={(e) => {
                      updateFormData("attributes.language", e.target.value);
                      if (e.target.value) {
                        setErrors(prev => ({ ...prev, language: "" }));
                      }
                    }}
                    className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs 
                      bg-transparent placeholder:text-gray-400 focus:outline-hidden 
                      focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 
                      ${
                        errors.language
                          ? "border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500"
                          : "border-gray-300 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800"
                      }`}
                  >
                    <option value="">Chọn ngôn ngữ</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
                {errors.language && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.language}</p>
                )}
              </div>

              {/* Thể loại */}
              <div>
                <Label className="mb-2 block">Thể loại <span className="text-red-500">*</span></Label>
                <MultiSelectCreatable
                  property="genre"
                  options={genreQuery.data.data}
                  selectedValues={formData.relationships.genres}
                  onChange={(vals) => {
                    updateFormData("relationships.genres", vals);
                    if (vals && vals.length > 0) {
                      setErrors(prev => ({ ...prev, genres: "" }));
                    }
                  }}
                  onCreateOption={handleCreateOption}
                />
                {errors.genres && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.genres}</p>
                )}
              </div>

              {/* Tác giả */}
              <div>
                <Label className="mb-2 block">Tác giả <span className="text-red-500">*</span></Label>
                <MultiSelectCreatable
                  property="creators"
                  options={creatorQuery.data.data}
                  selectedValues={formData.relationships.creators}
                  onChange={(vals) => {
                    updateFormData("relationships.creators", vals);
                    if (vals && vals.length > 0) {
                      setErrors(prev => ({ ...prev, creators: "" }));
                    }
                  }}
                  onCreateOption={handleCreateOption}
                />
                {errors.creators && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.creators}</p>
                )}
              </div>
            </div>

            {/* Cột 2 */}
            <div className="space-y-6">
              {/* Phiên bản */}
              <div>
                <Label className="mb-2 block">Phiên bản <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Ví dụ: 1st, 2nd, 3rd..."
                  value={formData.attributes.edition}
                  onChange={(e) => {
                    updateFormData("attributes.edition", e.target.value);
                    if (e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, edition: "" }));
                    }
                  }}
                  className={errors.edition ? "border-red-500 focus:border-red-500" : ""}
                />
                {errors.edition && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.edition}</p>
                )}
              </div>

              {/* Ngày xuất bản */}
              <div>
                <Label className="mb-2 block">Ngày xuất bản <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  max={todayDateString()}
                  value={getDateForInput(formData.attributes.published)}
                  onChange={(e) => {
                    updateFormData("attributes.published", e.target.value);
                    if (e.target.value) {
                      setErrors(prev => ({ ...prev, published: "" }));
                    }
                  }}
                  className={errors.published ? "border-red-500 focus:border-red-500" : ""}
                />
                {errors.published && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.published}</p>
                )}
              </div>

              {/* Nhà xuất bản */}
              <div>
                <Label className="mb-2 block">Nhà xuất bản <span className="text-red-500">*</span></Label>
                <SelectCreatable
                  property="publishers"
                  options={publisherQuery.data.data}
                  value={formData.relationships.publisher}
                  onChange={(val) => {
                    updateFormData("relationships.publisher", val);
                    if (val) {
                      setErrors(prev => ({ ...prev, publisher: "" }));
                    }
                  }}
                  onCreateOption={handleCreateOption}
                />
                {errors.publisher && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.publisher}</p>
                )}
              </div>

              {/* Ảnh bìa sách */}
              <div>
                <Label className="mb-2 block">Ảnh bìa sách {!bookId && <span className="text-red-500">*</span>}</Label>
                <ImagePicker
                  onFileChange={(file) => {
                    setImageFile(file);
                    imageChanged.current = true;
                    if (file) {
                      setErrors(prev => ({ ...prev, imageUrl: "" }));
                    }
                  }}
                  existingImageUrl={
                    formData.attributes.imageUrl
                      ? formData.attributes.imageUrl
                      : undefined
                  }
                  rows={6}
                />
                {errors.imageUrl && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.imageUrl}</p>
                )}
              </div>
            </div>

            {/* Mô tả - Full width */}
            <div className="lg:col-span-2">
              <Label className="mb-2 block">Mô tả</Label>
              <TextArea
                rows={5}
                placeholder="Nhập mô tả sách (không bắt buộc)"
                value={formData.attributes.blurb}
                onChange={(text) =>
                  updateFormData("attributes.blurb", text)
                }
                className="resize-none"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="text-red-500">*</span> là các trường bắt buộc
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/books")}
              className="px-6 py-2.5 rounded-xl font-medium"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-6 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition"
            >
              {bookId ? "Cập nhật sách" : "Xuất bản sách"}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  </div>
);

}
