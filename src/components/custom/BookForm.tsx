"use client";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import {toast} from "sonner";
import dynamic from "next/dynamic";
import React, {useState} from "react";
import {useBookProperty} from "@/hooks/api-calls/useBookProperty";
import {BaseProperty} from "@/components/custom/MultiSelectCreatable";
import Form from "@/components/form/Form";
import TextArea from "@/components/form/input/TextArea";
import ImagePicker from "@/components/custom/ImagePicker";
import {uploadToCloudinary} from "@/lib/cloudinaryUpload";
import {useBook} from "@/hooks/api-calls/useBook";
import SelectCreatable from "@/components/custom/SelectCreatable";

//explicitly client impprt to prevent hydration errors
const MultiSelectCreatable = dynamic(
    () => import("@/components/custom/MultiSelectCreatable"),
    {ssr: false}
);


export default function BookForm() {
    const {propertyQuery: genreQuery, propertyCreate: genreCreate} = useBookProperty("genre", 0, 100, true);
    const {propertyQuery: creatorQuery, propertyCreate: creatorCreate} = useBookProperty("creator", 0, 100, true);
    const {propertyQuery: publisherQuery, propertyCreate: publisherCreate} = useBookProperty("publisher", 0, 100, true);
    const {propertyQuery: seriesQuery, propertyCreate: seriesCreate} = useBookProperty("series", 0, 100, true);
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
            publisher: null as BaseProperty | null,
            series: null as BaseProperty | null
        }
    });

    if (genreQuery.isLoading || creatorQuery.isLoading || publisherQuery.isLoading || seriesQuery.isLoading) return <p
        className="p-6">Loading...</p>;

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
        if (imageFile) {
            const imageUrl = await uploadToCloudinary(imageFile);
            updateFormData("imageUrl", imageUrl);
        }
        bookCreate.mutate(formData);
        toast.success("created");
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
            case "series":
                seriesCreate.mutate({name: name});
                break;
        }
        toast.success("Created");
    };


    return (
        <div className="space-y-6">
            <Form onSubmit={handleSubmit}>
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                        <h2 className="text-lg font-medium text-gray-800 dark:text-white">
                            Products Description
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6 dark:border-gray-800">
                        {/*<form method="POST">*/}
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <Label>Title</Label>
                                <Input placeholder="title"
                                       value={formData.attributes.title}
                                       onChange={(e) => updateFormData("attributes.title", e.target.value)}/>
                            </div>
                            <div>
                                <Label>Edition</Label>
                                <Input placeholder="edition"
                                       value={formData.attributes.edition}
                                       onChange={(e) => updateFormData("attributes.edition", e.target.value)}/>
                            </div>
                            <div>
                                <Label>Language</Label>
                                <Input placeholder="Language"
                                       value={formData.attributes.language}
                                       onChange={(e) => updateFormData("attributes.language", e.target.value)}/>
                            </div>
                            <div>
                                <Label>Publication date</Label>
                                <Input type="date" placeholder="published"
                                       value={formData.attributes.published}
                                       onChange={(e) => updateFormData("attributes.published", e.target.value)}/>
                            </div>
                            <div>
                                <Label>Genre</Label>
                                <MultiSelectCreatable
                                    property="genre"
                                    options={genreQuery.data.data}
                                    selectedValues={formData.relationships.genres}
                                    onChange={(vals) => updateFormData("relationships.genres", vals)}
                                    onCreateOption={handleCreateOption}>
                                </MultiSelectCreatable>
                            </div>
                            <div>
                                <Label>Creators</Label>
                                <MultiSelectCreatable
                                    property="creators"
                                    options={creatorQuery.data.data}
                                    selectedValues={formData.relationships.creators}
                                    onChange={(vals) => updateFormData("relationships.creators", vals)}
                                    onCreateOption={handleCreateOption}>
                                </MultiSelectCreatable>

                            </div>
                            <div>
                                <Label>Publisher</Label>
                                <SelectCreatable
                                    property="publishers"
                                    options={publisherQuery.data.data}
                                    value={formData.relationships.publisher}
                                    onChange={(val) => updateFormData("relationships.publisher", val)}
                                    onCreateOption={handleCreateOption}
                                />
                            </div>
                            <div>
                                <Label>Series</Label>
                                <SelectCreatable
                                    property="series"
                                    options={seriesQuery.data.data}
                                    value={formData.relationships.series}
                                    onChange={(val) => updateFormData("relationships.series", val)}
                                    onCreateOption={handleCreateOption}
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <TextArea rows={6}
                                          placeholder="Receipt Info (optional)"
                                          value={formData.attributes.blurb}
                                          onChange={(text) => updateFormData("attributes.blurb", text)}
                                />
                            </div>
                            <div>
                                <Label>Product Image</Label>
                                <ImagePicker
                                    onFileChange={(file) => setImageFile(file)}
                                    existingImageUrl={undefined}
                                    rows={6}>
                                </ImagePicker>
                            </div>
                            {/*<div className="col-span-full">*/}
                            {/*    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">*/}
                            {/*        <div>*/}
                            {/*            <Label>Weight(KG)</Label>*/}
                            {/*            <Input type="number" placeholder="15"/>*/}
                            {/*        </div>*/}
                            {/*        {" "}*/}
                            {/*        <div>*/}
                            {/*            <Label>Length(CM)</Label>*/}
                            {/*            <Input type="number" placeholder="120"/>*/}
                            {/*        </div>*/}
                            {/*        {" "}*/}
                            {/*        <div>*/}
                            {/*            <Label>Width(CM)</Label>*/}
                            {/*            <Input type="number" placeholder="23"/>*/}
                            {/*        </div>*/}
                            {/*    </div>*/}
                            {/*</div>*/}
                        </div>
                        {/*</form>*/}
                    </div>
                    <div className="flex justify-end px-6 pb-6">
                        <Button
                            variant="primary"
                            className="px-6 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition"
                        >
                            Publish Product
                        </Button>
                    </div>
                </div>
            </Form>
        </div>
    )
        ;
}
