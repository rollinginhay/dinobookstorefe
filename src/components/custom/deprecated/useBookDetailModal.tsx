"use client";
import React, {useState} from "react";
import ComponentCard from "../../common/ComponentCard";
import Button from "../../ui/button/Button";
import Label from "../../form/Label";
import Input from "../../form/input/InputField";
import {useModal} from "@/hooks/useModal";
import {Modal} from "@/components/ui/modal";

export default function BookDetailModalForm(book) {
    const {isOpen, openModal, closeModal} = useModal();
    const [formData, setFormData] = useState({
        attributes: {
            id: 0,
            isbn: "",
            bookFormat: "",
            dimensions: "",
            printLength: "",
            stock: "",
            price: "",
        },
    });

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

    const handleSave = () => {
        // Handle save logic here
        closeModal();
    };

    return (
        <ComponentCard title="Form In Modal">
            <Button size="sm" onClick={openModal}>
                Open Modal
            </Button>
            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                className="max-w-[584px] p-5 lg:p-10"
            >
                <form className="">
                    <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
                        Personal Information
                    </h4>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        <div>
                            <Label>ISBN</Label>
                            <Input placeholder="title"
                                   value={formData.attributes.isbn}
                                   onChange={(e) => updateFormData("attributes.isbn", e.target.value)}/>
                        </div>

                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        <div>
                            <Label>Format</Label>
                            <Input placeholder="title"
                                   value={formData.attributes.bookFormat}
                                   onChange={(e) => updateFormData("attributes.isbn", e.target.value)}/>
                        </div>

                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        <div>
                            <Label>Length</Label>
                            <Input placeholder="title"
                                   value={formData.attributes.printLength}
                                   onChange={(e) => updateFormData("attributes.isbn", e.target.value)}/>
                        </div>

                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        <div>
                            <Label>Dimensions</Label>
                            <Input placeholder="title"
                                   value={formData.attributes.dimensions}
                                   onChange={(e) => updateFormData("attributes.isbn", e.target.value)}/>
                        </div>

                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        <div>
                            <Label>Price</Label>
                            <Input placeholder="title"
                                   value={formData.attributes.price}
                                   onChange={(e) => updateFormData("attributes.isbn", e.target.value)}/>
                        </div>

                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        <div>
                            <Label>Stock</Label>
                            <Input placeholder="title"
                                   value={formData.attributes.stock}
                                   onChange={(e) => updateFormData("attributes.isbn", e.target.value)}/>
                        </div>

                    </div>
                    <div className="flex items-center justify-end w-full gap-3 mt-6">
                        <Button size="sm" variant="outline" onClick={closeModal}>
                            Close
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>
        </ComponentCard>
    );
}
