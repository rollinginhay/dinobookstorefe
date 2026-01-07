"use client";
import React, {useEffect, useRef, useState} from "react";
import TableActionButtons from "@/components/custom/TableActionButtons";
import Button from "@/components/ui/button/Button";
import {getYear} from "@/lib/formatters";
import ProductInfoCard from "@/components/custom/ProductInfoCard";
import {useBookSingle} from "@/hooks/api-calls/useBookSingle";
import {useParams, useRouter} from "next/navigation";
import {useBookDetail} from "@/hooks/api-calls/useBookDetail";
import {useModal} from "@/hooks/useModal";
import {Modal} from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Form from "@/components/form/Form";
import {deserializeBook} from "@/lib/serializers";
import {BaseProperty} from "@/components/custom/MultiSelectCreatable";
import {ChevronDownIcon} from "@/icons";


const ProductDetailTable: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const {isOpen, openModal, closeModal} = useModal();
    const bookId = params.id?.toString();
    const bookFetch = useBookSingle(bookId);
    const {bookDetailCreate, bookDetailDelete} = useBookDetail(params.id!.toString());

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
            publisher: null as BaseProperty | null,
            series: null as BaseProperty | null,
            bookCopies: [] as any[]
        }
    });

    const initEditingItem = {
        id: 0,
        isbn: "",
        bookFormat: "",
        dimensions: "",
        printLength: "",
        stock: "",
        salePrice: "",
    };

    const isEditing = useRef(false);
    const [editingItem, setEditingItem] = useState(initEditingItem);
    const [dimensions, setDimensions] = useState({ width: "", height: "" });
    const [errors, setErrors] = useState({
        isbn: "",
        bookFormat: "",
        printLength: "",
        dimensions: "",
        salePrice: "",
        stock: ""
    });

    useEffect(() => {
        if (!bookFetch.isSuccess) return;
        setFormData(deserializeBook(bookFetch.data.data));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookFetch.dataUpdatedAt]);


    if (bookFetch.isLoading) return <p className="p-6">Đang tải...</p>;
    const book = bookFetch.data.data;
    const items: any[] = formData.relationships.bookCopies;
    const sortedItems = [...items].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );


    async function handleSubmit(e) {
        e.preventDefault();
        
        // Validate các trường
        const newErrors = {
            isbn: "",
            bookFormat: "",
            printLength: "",
            dimensions: "",
            salePrice: "",
            stock: ""
        };
        
        let hasError = false;
        
        // Validate ISBN
        if (!editingItem.isbn || editingItem.isbn.trim() === "") {
            newErrors.isbn = "Vui lòng nhập ISBN";
            hasError = true;
        }
        
        // Validate Định dạng
        if (!editingItem.bookFormat || editingItem.bookFormat.trim() === "") {
            newErrors.bookFormat = "Vui lòng chọn định dạng";
            hasError = true;
        }
        
        // Validate Số trang
        if (!editingItem.printLength || editingItem.printLength.trim() === "") {
            newErrors.printLength = "Vui lòng nhập số trang";
            hasError = true;
        } else if (isNaN(parseInt(editingItem.printLength)) || parseInt(editingItem.printLength) <= 0) {
            newErrors.printLength = "Số trang phải là số dương";
            hasError = true;
        }
        
        // Validate Kích thước
        if (!dimensions.width || !dimensions.height || dimensions.width.trim() === "" || dimensions.height.trim() === "") {
            newErrors.dimensions = "Vui lòng nhập đầy đủ kích thước";
            hasError = true;
        } else if (isNaN(parseInt(dimensions.width)) || parseInt(dimensions.width) <= 0 || 
                   isNaN(parseInt(dimensions.height)) || parseInt(dimensions.height) <= 0) {
            newErrors.dimensions = "Kích thước phải là số dương";
            hasError = true;
        }
        
        // Validate Giá bán
        if (!editingItem.salePrice || editingItem.salePrice.trim() === "") {
            newErrors.salePrice = "Vui lòng nhập giá bán";
            hasError = true;
        } else if (isNaN(parseInt(editingItem.salePrice)) || parseInt(editingItem.salePrice) <= 0) {
            newErrors.salePrice = "Giá bán phải là số dương";
            hasError = true;
        }
        
        // Validate Tồn kho
        if (!editingItem.stock || editingItem.stock.trim() === "") {
            newErrors.stock = "Vui lòng nhập tồn kho";
            hasError = true;
        } else if (isNaN(parseInt(editingItem.stock)) || parseInt(editingItem.stock) < 0) {
            newErrors.stock = "Tồn kho phải là số không âm";
            hasError = true;
        }
        
        setErrors(newErrors);
        
        if (hasError) {
            return;
        }
        
        // Build updatedFormData locally — do NOT push to state
        const updated = structuredClone(formData);
        const list = updated.relationships.bookCopies ?? [];

        // Combine dimensions trước khi lưu
        const itemToSave = {
            ...editingItem,
            dimensions: `${dimensions.width} x ${dimensions.height} cm`
        };
        
        if (itemToSave.id === 0) {
            list.push(itemToSave);
        } else {
            // update existing bookCopy
            const idx = list.findIndex(bc => String(bc.id) === String(itemToSave.id));
            if (idx !== -1) {
                list[idx] = itemToSave;
            } else {
                list.push(itemToSave);
            }
        }

        updated.relationships.bookCopies = list;

        // do NOT setFormData(updated) else an id:0 entry would be pushed into state
        // mutate, refetch on success will refresh state
        bookDetailCreate.mutate(updated);

        closeModal();
        setEditingItem(initEditingItem);
        setDimensions({ width: "", height: "" });
        setErrors({
            isbn: "",
            bookFormat: "",
            printLength: "",
            dimensions: "",
            salePrice: "",
            stock: ""
        });
    }


return (
  <div>
    <div className="mb-4">
      <div className="flex gap-3 sm:justify-between items-center">
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
        <Button
          className="bg-brand-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
          onClick={() => {
            setEditingItem(initEditingItem);
            setDimensions({ width: "", height: "" });
            isEditing.current = false;
            setErrors({
              isbn: "",
              bookFormat: "",
              printLength: "",
              dimensions: "",
              salePrice: "",
              stock: ""
            });
            openModal();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 10.0002H15.0006M10.0002 5V15.0006"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Thêm chi tiết sách
        </Button>
      </div>
    </div>
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5">
      <ProductInfoCard book={book} bookCopies={items} />
    </div>

    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                STT
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Phiên bản
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Định dạng
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                ISBN
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Năm xuất bản
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Số trang
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Kích thước
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Tồn kho
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Trạng thái
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {sortedItems.map((e, i) => (
              <tr
                key={e.id}
                className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {i + 1}
                </td>

                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {book.edition}
                </td>

                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {e.bookFormat}
                </td>

                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {e.isbn || "Chưa có ISBN"}
                </td>

                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {getYear(book.published)}
                </td>

                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {e.printLength}
                </td>

                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {e.dimensions || "-"}
                </td>

                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {e.stock || 0}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                      e.enabled
                        ? "bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-500"
                        : "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-500"
                    }`}
                  >
                    {e.enabled ? "Đang bán" : "Ngừng bán"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <TableActionButtons
                    viewLink={`/book/${e.id}`}
                    onEdit={() => {
                      setEditingItem(e);
                      isEditing.current = true;
                      setErrors({
                        isbn: "",
                        bookFormat: "",
                        printLength: "",
                        dimensions: "",
                        salePrice: "",
                        stock: ""
                      });
                      openModal();
                    }}
                    onDelete={() => {
                      bookDetailDelete.mutate(e.id);
                    }}
                    enableButtons={{
                      view: false,
                      edit: true,
                      delete: true,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Modal */}
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      className="max-w-[584px] p-5 lg:p-10"
    >
      <Form onSubmit={handleSubmit}>
        <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
          Chi tiết sách
        </h4>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div>
            <Label>ISBN</Label>
            <Input
              placeholder="ISBN"
              value={editingItem.isbn}
              onChange={(e) => {
                setEditingItem((prev) => ({ ...prev, isbn: e.target.value }));
                if (e.target.value.trim()) {
                  setErrors(prev => ({ ...prev, isbn: "" }));
                }
              }}
              className={errors.isbn ? "border-red-500 focus:border-red-500" : ""}
            />
            {errors.isbn && (
              <p className="mt-1 text-sm text-red-500">{errors.isbn}</p>
            )}
          </div>

          <div>
            <Label>Định dạng</Label>
            <div className="relative">
              <select
                value={editingItem.bookFormat}
                onChange={(e) => {
                  setEditingItem((prev) => ({
                    ...prev,
                    bookFormat: e.target.value,
                  }));
                  if (e.target.value) {
                    setErrors(prev => ({ ...prev, bookFormat: "" }));
                  }
                }}
                className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs 
                  bg-transparent placeholder:text-gray-400 focus:outline-hidden 
                  focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 
                  ${
                    errors.bookFormat
                      ? "border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500"
                      : "border-gray-300 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
              >
                <option value="">Chọn định dạng</option>
                <option value="Bìa mềm">Bìa mềm</option>
                <option value="Bìa cứng">Bìa cứng</option>
                <option value="Khác">Khác</option>
              </select>
              <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                <ChevronDownIcon />
              </span>
            </div>
            {errors.bookFormat && (
              <p className="mt-1 text-sm text-red-500">{errors.bookFormat}</p>
            )}
          </div>

          <div>
            <Label>Số trang</Label>
            <Input
              type="number"
              placeholder="Số trang"
              value={editingItem.printLength}
              onChange={(e) => {
                setEditingItem((prev) => ({
                  ...prev,
                  printLength: e.target.value,
                }));
                if (e.target.value.trim() && !isNaN(parseInt(e.target.value)) && parseInt(e.target.value) > 0) {
                  setErrors(prev => ({ ...prev, printLength: "" }));
                }
              }}
              className={errors.printLength ? "border-red-500 focus:border-red-500" : ""}
            />
            {errors.printLength && (
              <p className="mt-1 text-sm text-red-500">{errors.printLength}</p>
            )}
          </div>

          <div>
            <Label>Kích thước</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Rộng"
                value={dimensions.width}
                onChange={(e) => {
                  setDimensions(prev => ({ ...prev, width: e.target.value }));
                  if (e.target.value.trim() && !isNaN(parseInt(e.target.value)) && parseInt(e.target.value) > 0) {
                    setErrors(prev => ({ ...prev, dimensions: "" }));
                  }
                }}
                className={`flex-1 ${errors.dimensions ? "border-red-500 focus:border-red-500" : ""}`}
              />
              <span className="text-gray-500 dark:text-gray-400">x</span>
              <Input
                type="number"
                placeholder="Cao"
                value={dimensions.height}
                onChange={(e) => {
                  setDimensions(prev => ({ ...prev, height: e.target.value }));
                  if (e.target.value.trim() && !isNaN(parseInt(e.target.value)) && parseInt(e.target.value) > 0) {
                    setErrors(prev => ({ ...prev, dimensions: "" }));
                  }
                }}
                className={`flex-1 ${errors.dimensions ? "border-red-500 focus:border-red-500" : ""}`}
              />
              <span className="text-gray-500 dark:text-gray-400">cm</span>
            </div>
            {errors.dimensions && (
              <p className="mt-1 text-sm text-red-500">{errors.dimensions}</p>
            )}
          </div>

          <div>
            <Label>Giá bán</Label>
            <Input
              type="number"
              placeholder="Giá"
              value={editingItem.salePrice}
              onChange={(e) => {
                setEditingItem((prev) => ({
                  ...prev,
                  salePrice: e.target.value,
                }));
                if (e.target.value.trim() && !isNaN(parseInt(e.target.value)) && parseInt(e.target.value) > 0) {
                  setErrors(prev => ({ ...prev, salePrice: "" }));
                }
              }}
              className={errors.salePrice ? "border-red-500 focus:border-red-500" : ""}
            />
            {errors.salePrice && (
              <p className="mt-1 text-sm text-red-500">{errors.salePrice}</p>
            )}
          </div>



          <div>
            <Label>Tồn kho</Label>
            <Input
              type="number"
              placeholder="Số lượng"
              value={editingItem.stock}
              onChange={(e) => {
                setEditingItem((prev) => ({
                  ...prev,
                  stock: e.target.value,
                }));
                if (e.target.value.trim() && !isNaN(parseInt(e.target.value)) && parseInt(e.target.value) >= 0) {
                  setErrors(prev => ({ ...prev, stock: "" }));
                }
              }}
              className={errors.stock ? "border-red-500 focus:border-red-500" : ""}
            />
            {errors.stock && (
              <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end w-full gap-3 mt-6">
          <Button size="sm" variant="outline" onClick={closeModal}>
            Đóng
          </Button>
          <Button size="sm">
            Lưu
          </Button>
        </div>
      </Form>
    </Modal>
  </div>
);

};

export default ProductDetailTable;
