"use client";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";

export default function AddBookPropertyForm() {
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                {/*<div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">*/}
                {/*    <h2 className="text-lg font-medium text-gray-800 dark:text-white">*/}
                {/*        Products Description*/}
                {/*    </h2>*/}
                {/*</div>*/}
                <div className="p-4 sm:p-6 dark:border-gray-800">
                    <form>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="col-span-full">
                                <Label>Product Name</Label>
                                <Input placeholder="Enter product name"/>
                            </div>
                            <div className="col-span-full">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                    <div className="col-span-full">
                                        <Label>Description</Label>
                                        <TextArea rows={6} placeholder="Receipt Info (optional)"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="primary">Publish Product</Button>
            </div>
        </div>
    );
}
