export default function ExampleComponent({ id }: { id: string }) {
    switch (id) {
        default:
            return <div className="p-4 border rounded">
                {id}
            </div>
    }
}