"use client";
import React, {useState} from "react";
import ComponentCard from "../common/ComponentCard";
import Form from "../form/Form";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import {useBookProperty} from "@/hooks/api-calls/useBookProperty";
import {isLetterWords, isParagraphNullable} from "@/lib/validation";
import Label from "@/components/form/Label";

interface PropertyFormProps {
    property: string,
    editData?: any,
    onClose: () => void
}

export default function ProductPropertyForm({property, editData, onClose}: PropertyFormProps) {
    const editing = !!editData;

    const [formData, setFormData] = useState(editing ? editData : {
        name: "",
        note: "",
        enabled: true
    });


    const [errors, setErrors] = useState([] as any[]);

    const {propertyCreate, propertyUpdate} = useBookProperty(property);

    const validate = () => {
        const newErrors: [{ [key: string]: string }] = [] as any;

        if (!isLetterWords(formData.name, 2, 100)) {
            newErrors.push({detail: "name", title: "Incorrect format"});
        }
        if (!isParagraphNullable(formData.note, 0, 200)) {
            newErrors.push({detail: "note", title: "Incorrect format"});
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();


        if (!validate()) return;

        if (editing) {
            propertyUpdate.mutate(formData);
        } else {
            propertyCreate.mutate(formData);
        }

        onClose();
        setErrors([]);
    };

    return (
        <ComponentCard title="Add">
            <Form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 ">
                    <div>
                        <Label>Name</Label>
                        <Input type="text" placeholder="Name" name="name" defaultValue={formData.name}
                               onChange={handleChange}/>
                        <p className="text-red-400">{errors.filter((e) => e.detail === "name")?.[0]?.title}</p>

                    </div>
                    <div>
                        <Label>Note</Label>
                        <Input type="text" placeholder="Note" name="note" onChange={handleChange}
                               defaultValue={formData.note}/>
                        <p className="text-red-400">{errors.filter((e) => e.detail === "note")?.[0]?.title}</p>
                    </div>
                    <div>
                        <Label>Status</Label>
                        <select
                            name="enabled"
                            value={formData.enabled}
                            onChange={(e) => setFormData({...formData, enabled: e.target.value === "true"})}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                        >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>
                    <div className="col-span-full">
                        <Button className="w-full" size="sm">
                            Submit
                        </Button>
                        <p className="text-red-400">{errors.filter((e) => e.detail === "server")?.[0]?.title}</p>
                    </div>

                </div>
            </Form>
        </ComponentCard>
    );
}
