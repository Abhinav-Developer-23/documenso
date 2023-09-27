'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useForm } from 'react-hook-form';

import { completeDocumentWithToken } from '@documenso/lib/server-only/document/complete-document-with-token';
import { sortFieldsByPosition, validateFieldsInserted } from '@documenso/lib/utils/fields';
import { Document, Field, Recipient } from '@documenso/prisma/client';
import { FieldToolTip } from '@documenso/ui/components/field/field-tooltip';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import { Card, CardContent } from '@documenso/ui/primitives/card';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import { SignaturePad } from '@documenso/ui/primitives/signature-pad';

import { useRequiredSigningContext } from './provider';
import SignDialog from './sign-dialog';

export type SigningFormProps = {
  document: Document;
  recipient: Recipient;
  fields: Field[];
};

export const SigningForm = ({ document, recipient, fields }: SigningFormProps) => {
  const router = useRouter();

  const { fullName, signature, setFullName, setSignature } = useRequiredSigningContext();

  const [showConfirmSignatureDialog, setShowConfirmSignatureDialog] = useState(false);
  const [validateUninsertedFields, setValidateUninsertedFields] = useState(false);

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const uninsertedFields = useMemo(() => {
    return sortFieldsByPosition(fields.filter((field) => !field.inserted));
  }, [fields]);

  const onFormSubmit = () => {
    setValidateUninsertedFields(true);
    const isFieldsValid = validateFieldsInserted(fields);

    if (!isFieldsValid) {
      return;
    }
  };

  const onSigningComplete = async () => {
    await completeDocumentWithToken({
      token: recipient.token,
      documentId: document.id,
    });

    router.push(`/sign/${recipient.token}/complete`);
  };

  return (
    <form
      className={cn(
        'dark:bg-background border-border bg-widget sticky top-20 flex h-full max-h-[80rem] flex-col rounded-xl border px-4 py-6',
      )}
      onSubmit={handleSubmit(onFormSubmit)}
    >
      {validateUninsertedFields && uninsertedFields[0] && (
        <FieldToolTip key={uninsertedFields[0].id} field={uninsertedFields[0]} color="warning">
          Click to insert field
        </FieldToolTip>
      )}

      <fieldset
        disabled={isSubmitting}
        className={cn('-mx-2 flex flex-1 flex-col overflow-hidden px-2')}
      >
        <div className={cn('flex flex-1 flex-col')}>
          <h3 className="text-foreground text-2xl font-semibold">Sign Document</h3>

          <p className="text-muted-foreground mt-2 text-sm">
            Please review the document before signing.
          </p>

          <hr className="border-border mb-8 mt-4" />

          <div className="-mx-2 flex flex-1 flex-col gap-4 overflow-y-auto px-2">
            <div className="flex flex-1 flex-col gap-y-4">
              <div>
                <Label htmlFor="full-name">Full Name</Label>

                <Input
                  type="text"
                  id="full-name"
                  className="bg-background mt-2"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="Signature">Signature</Label>

                <Card className="mt-2" gradient degrees={-120}>
                  <CardContent className="p-0">
                    <SignaturePad
                      className="h-44 w-full"
                      defaultValue={signature ?? undefined}
                      onChange={(value) => {
                        setSignature(value);
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
              <Button
                type="button"
                className="dark:bg-muted dark:hover:bg-muted/80 w-full  bg-black/5 hover:bg-black/10"
                variant="secondary"
                size="lg"
                onClick={() => router.back()}
              >
                Cancel
              </Button>

              <SignDialog
                isSubmitting={isSubmitting}
                showConfirmSignatureDialog={showConfirmSignatureDialog}
                onSignatureComplete={onSigningComplete}
                setShowConfirmSignatureDialog={setShowConfirmSignatureDialog}
                document={document}
                fields={fields}
              />
            </div>
          </div>
        </div>
      </fieldset>
    </form>
  );
};
